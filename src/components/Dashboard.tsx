import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { convertToPdfBuffer, analyzePdfBuffer, PageAnalysis } from '../lib/pdfAnalyzer';
import { CloudUpload, UserCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function TransactionEntry({ category, shift, currentTotal, userConfig, onTransactionAdded }: { category: string, shift: string, currentTotal: number, userConfig: any, onTransactionAdded: () => void }) {
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localTotal, setLocalTotal] = useState(currentTotal);
  const [lastEntryTime, setLastEntryTime] = useState<string>('--:--');
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sync localTotal with currentTotal when it changes (e.g. initial load)
    setLocalTotal(currentTotal);
  }, [currentTotal]);

  useEffect(() => {
    inputRef.current?.focus();
    const handleFocus = () => {
      inputRef.current?.focus();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [category]); // re-focus when category changes

  const handleEnterAmount = async () => {
    const amt = parseFloat(currentAmount);
    if (!amt || isNaN(amt) || amt <= 0) return;
    
    setIsSubmitting(true);
    try {
      await api.addTransaction({
        userId: userConfig.id || userConfig.username,
        amount: amt,
        category,
        shift,
        timestamp: Date.now()
      });
      setLocalTotal(prev => prev + amt);
      setCurrentAmount('');
      
      const d = new Date();
      let hours = d.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const mins = d.getMinutes().toString().padStart(2, '0');
      setLastEntryTime(`${hours}:${mins} ${ampm}`);
      
      onTransactionAdded(); // Trigger global parent update
      
      // Focus back after submit
      inputRef.current?.focus();
    } catch (err: any) {
      console.error(err);
      alert('Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEnterAmount();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-full" onClick={() => inputRef.current?.focus()}>
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Entries</span>
        <span className="text-[10px] text-indigo-500 font-bold">Live Stream</span>
      </div>
      
      <div className="flex-1 p-4 relative flex flex-col justify-center space-y-4">
        <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold text-slate-400">PREVIOUSLY ENTERED</p>
            <p className="text-lg font-black text-slate-800">₱ {localTotal.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">TIMESTAMP</p>
            <p className="text-xs font-mono text-slate-600">
               {lastEntryTime === '--:--' ? 'No Entry Yet' : lastEntryTime}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <div>
            <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 block">Current Transaction Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold tracking-widest">₱</span>
              <input 
                ref={inputRef}
                type="number" 
                placeholder="0.00" 
                value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-8 pr-4 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button 
            onClick={handleEnterAmount}
            disabled={isSubmitting || !currentAmount}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 uppercase text-xs tracking-wider"
          >
            {isSubmitting ? 'Saving...' : 'Save Transaction'}
          </button>

          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 flex gap-3">
            <div className="w-5 h-5 flex-shrink-0 bg-yellow-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</div>
            <p className="text-[10px] text-yellow-700 leading-tight">
              Changing shifts requires all pending transactions to be saved. Summary will be generated automatically upon ending.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  'PRINTING',
  'Photocopy',
  'Laminate',
  'Bookbind Office',
  'PC Rental',
  'Incentives',
  'Commission',
  'Others',
  'Main Office Bookbind'
];

interface DashboardProps {
  userConfig: any;
  shift: string;
  onLogout: () => void;
  onAdminPanel?: () => void;
}

export function Dashboard({ userConfig, shift, onLogout, onAdminPanel }: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState('PRINTING');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileSummary, setFileSummary] = useState<any>(null);
  
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loadingTotals, setLoadingTotals] = useState(true);

  const fetchTotals = async () => {
    if (!userConfig) return;
    try {
      const result = await api.getTransactions();
      const todayStr = new Date().toDateString();

      const txs = result.transactions.filter((t: any) => {
        const tDateStr = new Date(t.timestamp).toDateString();
        return t.userId === (userConfig.id || userConfig.username) && 
               t.shift === shift &&
               tDateStr === todayStr;
      });
      
      const newTotals: Record<string, number> = {};
      CATEGORIES.forEach(c => newTotals[c] = 0);
      
      txs.forEach((dt: any) => {
        if (newTotals[dt.category] !== undefined) {
           newTotals[dt.category] += dt.amount;
        }
      });
      setTotals(newTotals);
    } catch(e) {
      console.error(e);
    } finally {
      setLoadingTotals(false);
    }
  };

  useEffect(() => {
    fetchTotals();
  }, [shift, userConfig]);

  const handleEndShift = async () => {
    try {
      const summaryTotal = Object.values(totals).reduce((a: number, b: number) => a + b, 0);
      await api.addShift({
        userId: userConfig.id || userConfig.username,
        shift,
        status: 'ended',
        totalAmount: summaryTotal,
        startTime: Date.now() - 28800000, 
        endTime: Date.now()
      });
      onLogout();
    } catch(e) {
      console.error(e);
      alert('Failed to end shift.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    setFileSummary(null);
    try {
      // Step 1: Convert to PDF
      setUploadProgress(40);
      const pdfBuffer = await convertToPdfBuffer(file);
      
      // Auto-download converted PDF if not originally a PDF
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
         const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = file.name.split('.').slice(0, -1).join('.') + '_converted.pdf';
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
      }
      
      // Step 2: Analyze the PDF
      setUploadProgress(70);
      const analysis = await analyzePdfBuffer(pdfBuffer);
      setUploadProgress(100);
      
      setFileSummary({
         name: file.name,
         pages: analysis
      });
    } catch (err) {
      console.error(err);
      alert('Failed to process file. Ensure it is a supported format (PDF, DOCX, XLSX, CSV, JPG, PNG).');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const username = userConfig.username || userConfig.email?.split('@')[0] || 'User';

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full bg-slate-50 font-sans">
      
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shrink-0 h-full overflow-hidden">
        <div className="p-4 space-y-1.5 flex-1 relative flex flex-col justify-start overflow-y-auto">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 shrink-0">Service Selector</h3>
          
          {CATEGORIES.map(cat => {
            const isPrinting = cat === 'PRINTING';
            const isSelected = selectedCategory === cat;
            return (
              <label 
                key={cat}
                className={clsx(
                  "flex items-center gap-3 cursor-pointer group shrink-0",
                  !isPrinting && "py-0.5"
                )}
                onClick={() => setSelectedCategory(cat)}
              >
                <input 
                  type="radio" 
                  name="service" 
                  checked={isSelected}
                  readOnly
                  className="w-4 h-4 text-red-600 accent-indigo-600"
                />
                {isPrinting ? (
                   <span className={clsx(
                     "font-bold text-lg uppercase tracking-tighter", 
                     isSelected ? "text-red-600" : "text-slate-400 group-hover:text-red-500"
                   )}>
                     PRINTING
                   </span>
                ) : (
                   <span className={clsx(
                     "text-[13px] font-medium",
                     isSelected ? "text-indigo-600" : "text-slate-600 group-hover:text-slate-900"
                   )}>
                     {cat}
                   </span>
                )}
              </label>
            );
          })}
        </div>

        {/* Admin Access Panel */}
        {userConfig.role === 'admin' && (
          <div className="mt-auto p-4 border-t border-slate-100 bg-white shrink-0">
            <button 
              onClick={onAdminPanel}
              className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded hover:bg-slate-200 transition-colors"
            >
               ADMIN PANEL
            </button>
          </div>
        )}
      </div>

      {/* Right Side Panel */}
      <div className="flex-1 flex flex-col p-6 h-full overflow-hidden">
        
        {/* Welcome Header */}
        <div className="flex justify-between items-start mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-light text-slate-800">Hi <span className="font-bold">{username}</span>! Welcome back.</h1>
            <p className="text-slate-500 text-sm">Here is your dashboard. You are working on the <span className="text-indigo-600 font-semibold">{shift} Working Shift</span>.</p>
          </div>
          <button 
            onClick={handleEndShift}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded flex items-center gap-2 hover:bg-black transition-all"
          >
            <span>END SHIFT</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"/></svg>
          </button>
        </div>

        {!loadingTotals ? (
          <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
            {/* File Uploader & Summary */}
            <div className="space-y-4 flex flex-col overflow-hidden">
              <div 
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={handleDrop}
                 onClick={() => document.getElementById('file-upload')?.click()}
                 className={clsx(
                   "border-2 border-dashed rounded-xl h-1/2 shrink-0 flex flex-col items-center justify-center p-6 transition-colors cursor-pointer hover:bg-slate-100",
                   selectedCategory === 'PRINTING' ? "border-slate-300 bg-slate-50" : "border-slate-200 bg-slate-50 opacity-50"
                 )}
              >
                 <input 
                   type="file" 
                   id="file-upload" 
                   className="hidden" 
                   accept=".pdf,.png,.jpg,.jpeg,.docx,.csv,.xlsx" 
                   onChange={handleFileSelect} 
                 />
                 {isUploading ? (
                    <div className="w-full">
                       <p className="text-slate-600 text-sm font-medium mb-2 text-center">Processing... {uploadProgress}%</p>
                       <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                         <div className="bg-indigo-500 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                       </div>
                    </div>
                 ) : (
                    <>
                       <svg className="w-10 h-10 text-slate-300 mb-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                       </svg>
                       <p className="text-slate-600 text-sm font-medium">Click or drag & drop files here</p>
                       <p className="text-slate-400 text-[10px] mt-1 shrink-0 text-center">PDF, DOCX, JPG, PNG, and Spreadsheet supported</p>
                    </>
                 )}
              </div>

              {/* Page Analysis Summary */}
              {fileSummary && (
                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm animate-in slide-in-from-bottom-2 fade-in flex-1 min-h-0 flex flex-col overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2 shrink-0">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                    PAGE SUMMARY: {fileSummary.name}
                  </h4>
                  <div className="flex-1 overflow-y-auto pl-1 pr-2 space-y-2">
                    {fileSummary.pages.map((p: any, idx: number) => (
                      <div key={idx} className="flex flex-col text-[11px] border-b border-slate-50 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-500 font-medium uppercase shrink-0">Page {p.page} <span className="text-[9px] text-slate-400 normal-case ml-1">- {p.pageSize}</span></span>
                          <span className="text-slate-700">Color: <span className="font-bold text-red-500">{p.coloredPercent}%</span> | B&W: <span className="font-bold">{p.blackWhitePercent}%</span> | Image: <span className="font-bold text-indigo-500">{p.imagePercent}%</span></span>
                        </div>
                        {p.textSummary && (
                          <div className="text-[10px] text-slate-400 bg-slate-50 p-1 rounded italic truncate">
                             {p.textSummary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Entry Form */}
            <div className="h-full">
              <TransactionEntry 
                 category={selectedCategory} 
                 shift={shift} 
                 currentTotal={(Object.values(totals) as number[]).reduce((a, b) => a + b, 0)} 
                 userConfig={userConfig}
                 onTransactionAdded={fetchTotals}
              />
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-1 justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}

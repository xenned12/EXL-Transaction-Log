import React, { ReactNode, useState } from 'react';
import { X, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface WindowFrameProps {
  children: ReactNode;
  showClose: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  isMinimized: boolean;
}

export function WindowFrame({ children, showClose, onClose, onMinimize, isMinimized }: WindowFrameProps) {
  // Center roughly or top-right. We'll use absolute right-0 top-0 in the style but give it drag capability.
  // We can track drag bounds if we want, but drag constraints can just be window.
  
  if (isMinimized) {
    return (
      <motion.div 
           drag
           dragMomentum={false}
           className="absolute top-0 right-0 w-[200px] h-10 bg-slate-50 border border-slate-300 shadow-lg flex items-center justify-between px-2 cursor-pointer z-50 rounded-bl-md"
           onClick={onMinimize}>
        <div className="flex items-center gap-2 drag-handle w-full cursor-grab active:cursor-grabbing">
           <div className="w-3 h-3 bg-indigo-600 rounded flex items-center justify-center shrink-0">
             <div className="w-1 h-1 bg-white rounded-full"></div>
           </div>
           <span className="text-xs font-semibold text-slate-600 tracking-tight italic select-none">EXL TRANSACTION LOG</span>
        </div>
        <div className="flex gap-1 shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
           <button className="p-1 hover:bg-slate-200 rounded text-slate-500" onClick={onMinimize}><Minus size={14}/></button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      drag
      dragHandle=".app-title-bar"
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 m-auto w-[947px] h-[525px] bg-slate-50 shadow-2xl flex flex-col overflow-hidden rounded-lg border border-slate-300 z-50 pointer-events-auto"
    >
      {/* App Title Bar */}
      <div className="app-title-bar h-10 bg-white border-b border-slate-200 flex items-center justify-between pl-4 select-none shrink-0 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center flex-shrink-0">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span className="text-xs font-semibold text-slate-600 tracking-tight italic">EXL TRANSACTION LOG</span>
        </div>
        <div className="flex h-full z-10" onPointerDown={e => e.stopPropagation()}>
          <button 
            onClick={onMinimize}
            className="h-full px-4 hover:bg-slate-100 flex items-center justify-center transition-colors group cursor-pointer"
            title="Minimize"
          >
            <Minus size={16} className="text-slate-500 group-hover:text-slate-700" />
          </button>
          {showClose && (
            <button 
              onClick={onClose}
              className="h-full px-4 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors group cursor-pointer"
              title="Close"
            >
              <X size={16} className="text-slate-500 group-hover:text-white" />
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {children}
      </div>
    </motion.div>
  );
}


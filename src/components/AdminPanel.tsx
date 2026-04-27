import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { X, UserPlus, Trash, Edit, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'transactions' | 'users'>('transactions');
  
  // Modals for editing/adding user
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [userForm, setUserForm] = useState({ email: '', username: '', role: 'user', needsPasswordChange: true });

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch(e) {
      console.error(e);
      alert('Failed to load users');
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await api.getTransactions();
      const sortedTxs = res.transactions.sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 50);
      setTransactions(sortedTxs);
    } catch(e) {
      console.error(e);
      alert('Failed to load transactions');
    }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else loadTransactions();
  }, [activeTab]);

  const handleSaveUser = async () => {
    try {
      if (isAddMode) {
         await api.register(userForm.username, userForm.email, 'password123');
      } else {
         await api.updateUser(editingUser.id, userForm);
      }
      loadUsers();
      setEditingUser(null);
      setIsAddMode(false);
    } catch(e) {
      console.error(e);
      alert('Failed to save user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if(!window.confirm('Delete user?')) return;
    try {
      await api.deleteUser(id);
      loadUsers();
    } catch(e) { console.error(e); alert('Failed to delete user'); }
  };

  return (
    <div className="absolute inset-0 bg-slate-50 z-40 flex flex-col animate-in slide-in-from-bottom flex-1 w-full h-full overflow-hidden">
       {/* Admin Header Top */}
       <div className="flex bg-slate-800 text-white h-14 items-center justify-between px-6 shrink-0 shadow-sm z-10 relative">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
               <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
             </div>
             <h2 className="text-sm font-bold tracking-wider">ADMINISTRATOR CONSOLE</h2>
          </div>
          <button 
             onClick={onClose} 
             className="w-8 h-8 hover:bg-slate-700 flex items-center justify-center rounded-lg transition-colors border border-transparent hover:border-slate-600"
          >
             <X size={18} className="text-slate-300" />
          </button>
       </div>
       
       {/* Tabs */}
       <div className="flex bg-white border-b border-slate-200 shrink-0 px-6">
         <button 
           className={clsx(
             "px-6 py-4 text-xs font-bold uppercase tracking-wider relative",
             activeTab === 'transactions' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
           )}
           onClick={() => setActiveTab('transactions')}
         >
           Daily Financials
           {activeTab === 'transactions' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
         </button>
         <button 
           className={clsx(
             "px-6 py-4 text-xs font-bold uppercase tracking-wider relative",
             activeTab === 'users' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
           )}
           onClick={() => setActiveTab('users')}
         >
           User Management
           {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
         </button>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-auto bg-slate-50 p-6 relative">
         {activeTab === 'transactions' && (
           <div className="animate-in fade-in max-w-5xl mx-auto">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-light text-slate-800">Financial Ledger</h3>
               <div className="text-sm font-semibold text-slate-500 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
                 {transactions.length} Records
               </div>
             </div>
             <div className="bg-white border text-sm rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date/Time</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User ID</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shift</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-600">{new Date(t.timestamp).toLocaleString()}</td>
                        <td className="p-4 text-slate-400 font-mono text-xs">{t.userId.substring(0,8)}...</td>
                        <td className="p-4 text-slate-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">{t.shift}</span>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">{t.category}</td>
                        <td className="p-4 text-right font-black text-indigo-600 text-base tabular-nums">₱ {t.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">No transactions found</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
           </div>
         )}

         {activeTab === 'users' && (
           <div className="animate-in fade-in max-w-5xl mx-auto">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-light text-slate-800">System Users</h3>
                <button 
                  onClick={() => { setIsAddMode(true); setEditingUser(null); setUserForm({ email: '', username: '', role: 'user', needsPasswordChange: true }); }}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <UserPlus size={16}/> Add User
                </button>
             </div>
             
             {(isAddMode || editingUser) && (
               <div className="bg-white border rounded-xl p-6 mb-6 shadow-xl shadow-slate-200/50 animate-in slide-in-from-top-4 fade-in z-20 relative">
                 <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                   {isAddMode ? 'CREATE NEW ACCOUNT' : 'MODIFY USER ACCOUNT'}
                 </h4>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                     <input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="bg-slate-50 border border-slate-200 p-3 w-full rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                     <input type="text" value={userForm.username} onChange={(e) => setUserForm({...userForm, username: e.target.value})} className="bg-slate-50 border border-slate-200 p-3 w-full rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
                     <select value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})} className="bg-slate-50 border border-slate-200 p-3 w-full rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors appearance-none">
                        <option value="user">Standard User</option>
                        <option value="admin">Administrator</option>
                     </select>
                   </div>
                 </div>
                 <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-2">
                   <button onClick={() => { setIsAddMode(false); setEditingUser(null); }} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-xs uppercase tracking-wider transition-colors">Cancel</button>
                   <button onClick={handleSaveUser} className="px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-md">
                      <Check size={16}/> Save Details
                   </button>
                 </div>
               </div>
             )}

             <div className="bg-white border text-sm rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 font-bold text-slate-800">{u.username}</td>
                        <td className="p-4 text-slate-500">{u.email}</td>
                        <td className="p-4">
                           <span className={clsx(
                             "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider", 
                             u.role==='admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                           )}>
                             {u.role}
                           </span>
                        </td>
                        <td className="p-4">
                           <span className={clsx(
                              "flex items-center gap-1.5 text-xs font-semibold",
                              u.needsPasswordChange ? "text-amber-600" : "text-emerald-600"
                           )}>
                             <div className={clsx("w-1.5 h-1.5 rounded-full", u.needsPasswordChange ? "bg-amber-500" : "bg-emerald-500")}></div>
                             {u.needsPasswordChange ? 'Pending Reset' : 'Active'}
                           </span>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setEditingUser(u); setUserForm({ email: u.email, username: u.username, role: u.role, needsPasswordChange: u.needsPasswordChange }); setIsAddMode(false); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit User"><Edit size={16}/></button>
                           <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete User"><Trash size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
           </div>
         )}
       </div>
    </div>
  );
}

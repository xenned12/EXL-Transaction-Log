import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  shift: z.enum(['1st', '2nd', '3rd']),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginProps {
  onLoginSuccess: (userConfig: any, shift: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { shift: '1st' }
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const email = data.username.includes('@') ? data.username : `${data.username}@system.local`;
      
      let userConfig;
      if (isRegisterMode) {
         try {
           const result = await api.register(data.username, email, data.password);
           userConfig = result.user;
         } catch (error: any) {
           throw new Error('Registration failed: ' + error.message);
         }
         onLoginSuccess(userConfig, data.shift);
      } else {
         try {
           const result = await api.login(data.username, data.password);
           userConfig = result.user;
         } catch (signInErr: any) {
           // Auto-create admin/admin on very first try if it fails
           if (data.username === 'admin' && data.password === 'admin') {
              const res = await api.register('admin', email, data.password);
              userConfig = res.user;
           } else {
              throw signInErr;
           }
         }

         if (userConfig) {
           onLoginSuccess(userConfig, data.shift);
         }
      }
    } catch (error: any) {
      console.error(error);
      if (isRegisterMode) {
        setErrorMsg(error.message || 'Registration failed');
      } else {
        setErrorMsg('Invalid credentials. Please verify your username and password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 w-full h-full relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 z-0"></div>

      <div className="bg-white p-5 border border-slate-200 shadow-xl shadow-slate-200/50 rounded-xl w-full max-w-[340px] z-10 relative">
        <div className="flex justify-center mb-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
        <h2 className="text-lg font-bold text-center mb-1 text-slate-800 tracking-tight">
          {isRegisterMode ? 'Register (Admin)' : 'System Login'}
        </h2>
        <p className="text-center text-slate-500 text-[11px] mb-4">Enter your credentials to access the terminal</p>
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 border border-red-100 p-2 text-[11px] rounded-lg mb-3 flex items-start gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span className="leading-tight pt-0.5">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500">Username / Email</label>
            <input 
              {...register('username')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-50 transition-all text-xs font-medium text-slate-800" 
              placeholder="Ex: adminuser"
            />
            {errors.username && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500">Password</label>
            <input 
              type="password"
              {...register('password')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-50 transition-all text-xs font-medium text-slate-800"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500">Working Shift</label>
            <div className="relative">
               <select 
                 {...register('shift')}
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-50 transition-all text-xs font-medium text-slate-800 appearance-none pointer-events-auto"
               >
                 <option value="1st">1st Shift</option>
                 <option value="2nd">2nd Shift</option>
                 <option value="3rd">3rd Shift</option>
               </select>
               <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
               </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 mt-1"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : null}
            {isRegisterMode ? 'CREATE ACCOUNT' : 'AUTHENTICATE'}
          </button>
        </form>

        <div className="mt-4 text-center">
           <button 
             type="button" 
             onClick={() => { setIsRegisterMode(!isRegisterMode); setErrorMsg(''); }}
             className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
           >
             {isRegisterMode ? 'Return to Login' : 'System Setup (Register Admin)'}
           </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';

const passwordSchema = z.object({
  password: z.string()
    .min(8, '8 characters minimum')
    .regex(/[A-Z]/, '1 Capital letter required')
    .regex(/[a-zA-Z]/, 'Must contain a letter')
    .regex(/[0-9]/, 'Must contain a digit')
    .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

interface ChangePasswordProps {
  user: any;
  onSuccess: (updatedUser: any) => void;
}

export function ChangePassword({ user, onSuccess }: ChangePasswordProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema)
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: PasswordForm) => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (!user) {
        throw new Error("No user context");
      }
      const res = await api.updateUser(user.id || user.username, {
        password: data.password,
        needsPasswordChange: false
      });
      onSuccess(res.user || res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to update password. Please re-authenticate and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 w-full h-full relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 z-0"></div>

      <div className="bg-white p-8 border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl w-full max-w-[450px] z-10 relative">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2 text-slate-800 tracking-tight">Required Security Update</h2>
        <p className="text-center text-slate-500 text-sm mb-6">As this is your first login, please update your system password.</p>
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 border border-red-100 p-3 text-sm rounded-lg mb-6 flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span className="leading-tight pt-0.5">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">New Password</label>
            <input 
              type="password"
              {...register('password')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800" 
            />
            {errors.password && <p className="text-xs text-red-500 mt-2 font-medium">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">Confirm Password</label>
            <input 
              type="password"
              {...register('confirmPassword')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800" 
            />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-2 font-medium">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : null}
            SECURE ACCOUNT
          </button>
        </form>
      </div>
    </div>
  );
}

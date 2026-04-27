/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WindowFrame } from './components/WindowFrame';
import { Login } from './components/Login';
import { ChangePassword } from './components/ChangePassword';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<'login' | 'change-password' | 'dashboard'>('login');
  const [userConfig, setUserConfig] = useState<any>(null);
  const [shift, setShift] = useState<string>('1st');
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAppClosed, setIsAppClosed] = useState(false);

  // Authentication check is now handled via state since we don't have a persistent session currently
  
  const handleLoginSuccess = (config: any, selectedShift: string) => {
    setUserConfig(config);
    setShift(selectedShift);
    if (config.needsPasswordChange) {
       setView('change-password');
    } else {
       setView('dashboard');
    }
  };

  const handlePasswordChanged = (updatedUser: any) => {
    setUserConfig(updatedUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUserConfig(null);
    setView('login');
    setShowAdmin(false);
  };

  if (isAppClosed) {
    return null; // App closed
  }

  const showClose = view === 'login' || view === 'change-password';

  return (
    <WindowFrame 
       isMinimized={isMinimized} 
       onMinimize={() => setIsMinimized(!isMinimized)}
       showClose={showClose}
       onClose={() => setIsAppClosed(true)}
    >
      {view === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
      {view === 'change-password' && <ChangePassword user={userConfig} onSuccess={handlePasswordChanged} />}
      {view === 'dashboard' && (
        <>
          <Dashboard 
             userConfig={userConfig} 
             shift={shift} 
             onLogout={handleLogout} 
             onAdminPanel={() => setShowAdmin(true)}
          />
          {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
        </>
      )}
    </WindowFrame>
  );
}

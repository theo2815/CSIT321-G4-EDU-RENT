import React, { useState, useCallback } from 'react';

import LoginModal from '../components/auth/LoginModal';
import RegisterModal from '../components/auth/RegisterModal';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import EnterOtpModal from '../components/auth/EnterOtpModal';
import ResetPasswordModal from '../components/auth/ResetPasswordModal';
import { AuthModalContext } from './ContextDefinitions';

export const AuthModalProvider = ({ children }) => {
  const [view, setView] = useState(null);
  const [data, setData] = useState({});
  const [pendingRedirect, setPendingRedirect] = useState(null);

  const openLogin = useCallback((redirectPath = null) => {
    if (typeof redirectPath === 'string') {
      setPendingRedirect(redirectPath);
    }
    setView('LOGIN');
  }, []);

  const openRegister = useCallback(() => setView('REGISTER'), []);
  const openForgotPassword = useCallback(() => setView('FORGOT'), []);
  
  const openOtp = useCallback((email) => {
    setData({ email });
    setView('OTP');
  }, []);

  const openResetPassword = useCallback((token) => {
    setData(prev => ({ ...prev, token }));
    setView('RESET');
  }, []);

  const closeModal = useCallback(() => {
    setView(null);
    setData({});
    setPendingRedirect(null);
  }, []);

  const contextValue = React.useMemo(() => ({
    openLogin, openRegister, openForgotPassword, openOtp, openResetPassword, pendingRedirect, closeModal
  }), [openLogin, openRegister, openForgotPassword, openOtp, openResetPassword, pendingRedirect, closeModal]);

  return (
    <AuthModalContext.Provider value={contextValue}>
      {children}

      {view === 'LOGIN' && (
        <LoginModal 
          isOpen={true} 
          onClose={closeModal} 
          onSwitchToRegister={openRegister}
          onSwitchToForgot={openForgotPassword}
        />
      )}

      {view === 'REGISTER' && (
        <RegisterModal 
          isOpen={true} 
          onClose={closeModal} 
          onSwitchToLogin={openLogin}
        />
      )}

      {view === 'FORGOT' && (
        <ForgotPasswordModal 
          isOpen={true} 
          onClose={closeModal} 
          onSwitchToLogin={openLogin}
          onSwitchToOtp={openOtp}
        />
      )}

      {view === 'OTP' && (
        <EnterOtpModal 
          isOpen={true} 
          onClose={closeModal}
          email={data.email}
          onSwitchToReset={openResetPassword}
          onBack={openForgotPassword}
        />
      )}

      {view === 'RESET' && (
        <ResetPasswordModal 
          isOpen={true} 
          onClose={closeModal}
          token={data.token}
          onSwitchToLogin={openLogin}
        />
      )}

    </AuthModalContext.Provider>
  );
};
import React, { createContext, useContext, useState, useCallback } from 'react';

import LoginModal from '../components/auth/LoginModal';
import RegisterModal from '../components/auth/RegisterModal';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import EnterOtpModal from '../components/auth/EnterOtpModal';
import ResetPasswordModal from '../components/auth/ResetPasswordModal';

const AuthModalContext = createContext();

export const AuthModalProvider = ({ children }) => {
  const [view, setView] = useState(null);
  
  const [data, setData] = useState({});

  const openLogin = useCallback(() => setView('LOGIN'), []);
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
  }, []);

  return (
    <AuthModalContext.Provider value={{ openLogin, openRegister, openForgotPassword, openOtp, openResetPassword, closeModal }}>
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

// Custom hook for easy access
export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
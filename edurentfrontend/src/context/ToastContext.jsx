import React, { useState, useCallback, useMemo } from 'react'; // Import useMemo
import '../static/Feedback.css';
import { ToastContext } from './ContextDefinitions';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    setToasts(prev => {
      // Prevent duplicate toasts: if exact same message & type exists, don't add
      if (prev.some(t => t.message === message && t.type === type)) {
        return prev;
      }
      return [...prev, { id, message, type }];
    });
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const contextValue = useMemo(() => ({
    showSuccess: (msg) => addToast(msg, 'success'),
    showError: (msg) => addToast(msg, 'error'),
    showInfo: (msg) => addToast(msg, 'info'),
    showWarning: (msg) => addToast(msg, 'warning')
  }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`} onClick={() => removeToast(t.id)}>
            <span>
              {t.type === 'success' && '✅'}
              {t.type === 'error' && 'XY'}
              {t.type === 'info' && 'ℹ️'}
              {t.type === 'warning' && '⚠️'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
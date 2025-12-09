import React, { createContext, useContext, useState, useCallback } from 'react';
import '../static/Feedback.css';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ 
      showSuccess: (msg) => addToast(msg, 'success'),
      showError: (msg) => addToast(msg, 'error'),
      showInfo: (msg) => addToast(msg, 'info'),
      showWarning: (msg) => addToast(msg, 'warning')
    }}>
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

export const useToast = () => useContext(ToastContext);
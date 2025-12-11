import React, { createContext, useContext, useState } from 'react';
import '../static/Feedback.css';

const ConfirmationContext = createContext();

export const ConfirmationProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState(null);

  // Returns a promise that resolves to true (confirmed) or false (cancelled)
  const confirm = ({ title, message, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false }) => {
    return new Promise((resolve) => {
      setModalConfig({
        title,
        message,
        confirmText,
        cancelText,
        isDangerous,
        onConfirm: () => {
          setModalConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setModalConfig(null);
          resolve(false);
        }
      });
    });
  };

  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      {modalConfig && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3 className="confirm-title">{modalConfig.title}</h3>
            <p className="confirm-message">{modalConfig.message}</p>
            <div className="confirm-actions">
              <button 
                className="btn btn-outline" 
                onClick={modalConfig.onCancel}
              >
                {modalConfig.cancelText}
              </button>
              <button 
                className={`btn ${modalConfig.isDangerous ? 'btn-delete' : 'btn-primary-accent'}`} 
                onClick={modalConfig.onConfirm}
              >
                {modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmationContext);
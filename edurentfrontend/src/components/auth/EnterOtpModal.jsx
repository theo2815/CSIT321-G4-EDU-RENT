import React, { useState } from 'react';
import '../../static/Auth.css';
import '../../static/ProductDetailModal.css';

export default function EnterOtpModal({ isOpen, onClose, email, onSwitchToReset, onBack }) {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleResend = async () => {
    setMessage({ type: 'info', content: 'Resending code...' });
    setLoading(true);
    try {
        const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        
        if (response.ok) {
            setMessage({ type: 'success', content: 'Code resent! Check your email.' });
        } else {
            setMessage({ type: 'error', content: 'Failed to resend code.' });
        }
    } catch (error) {
        setMessage({ type: 'error', content: 'Network error.' });
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    if (!otp.trim()) {
        setMessage({ type: 'error', content: 'Please enter the code.' });
        return;
    }

    setLoading(true);

    
    setTimeout(() => {
        setLoading(false);
        setMessage({ type: 'success', content: 'Code accepted!' });
        
        // Pass the OTP (token) to the next modal
        setTimeout(() => {
            onSwitchToReset(otp);
        }, 500);
    }, 800);
  };

  return (
    <div className="modal-overlay visible" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '400px', padding: '0' }}>
        <div className="modal-header" style={{ padding: '1rem 1.5rem' }}>
          <h3 className="modal-title">Enter Code</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            We sent a code to <strong>{email || 'your email'}</strong>.
          </p>

          <form className="auth-form" onSubmit={handleSubmit} style={{ gap: '1rem' }}>
            <div>
              <label htmlFor="otp-input" className="auth-label">Code / Token</label>
              <input
                id="otp-input"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="auth-input"
                placeholder="Enter code from email"
                disabled={loading}
              />
            </div>

            {message.content && (
              <div className={`auth-message ${
                  message.type === 'success' ? 'auth-message-success' : 
                  message.type === 'info' ? 'auth-message-info' : 'auth-message-error'
              }`}>
                {message.content}
              </div>
            )}

            <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div className="auth-redirect-link" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
                Didn't receive it?{' '}
                <button 
                    onClick={handleResend} 
                    disabled={loading}
                    className="auth-link" 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                    Resend
                </button>
            </span>
            
            <button 
              onClick={onBack} 
              className="auth-link" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
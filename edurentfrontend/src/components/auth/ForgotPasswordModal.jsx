import React, { useState } from 'react';
import '../../static/Auth.css';
import '../../static/ProductDetailModal.css';

export default function ForgotPasswordModal({ isOpen, onClose, onSwitchToLogin, onSwitchToOtp }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });
    setLoading(true);

    try {
      // API call to Spring Boot backend
      const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          content: data.message || 'Reset instructions sent.' 
        });
        
        // Wait a brief moment so user sees the success message, then move to OTP
        setTimeout(() => {
            onSwitchToOtp(email);
        }, 1000);
      } else {
        setMessage({ 
          type: 'error', 
          content: data.error || 'Failed to send instructions.' 
        });
      }

    } catch (error) {
      console.error('Password reset error:', error);
      setMessage({ type: 'error', content: 'Network error. Check backend.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay visible" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '400px', padding: '0' }}>
        <div className="modal-header" style={{ padding: '1rem 1.5rem' }}>
          <h3 className="modal-title">Forgot Password?</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Enter your email and we'll send you instructions to reset your password.
          </p>

          <form className="auth-form" onSubmit={handleSubmit} style={{ gap: '1rem' }}>
            <div>
              <label htmlFor="fp-email" className="auth-label">Email</label>
              <input
                id="fp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@school.edu"
                disabled={loading}
              />
            </div>

            {message.content && (
              <div className={`auth-message ${message.type === 'success' ? 'auth-message-success' : 'auth-message-error'}`}>
                {message.content}
              </div>
            )}

            <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>

          <div className="auth-redirect-link" style={{ marginTop: '1rem' }}>
            <button 
              onClick={onSwitchToLogin} 
              className="auth-link" 
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
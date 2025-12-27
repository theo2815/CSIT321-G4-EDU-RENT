import React, { useState } from 'react';
import '../../static/Auth.css';
import '../../static/ProductDetailModal.css';

export default function ResetPasswordModal({ isOpen, onClose, token, onSwitchToLogin }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    // Validation
    if (password !== confirmPassword) {
      setMessage({ type: 'error', content: 'Passwords do not match.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', content: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          newPassword: password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          content: data.message || 'Password successfully reset!' 
        });
        
        // Success: Redirect to login modal after a short delay
        setTimeout(() => {
            onSwitchToLogin(); 
        }, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          content: data.error || 'Failed to reset password. Token may be expired.' 
        });
      }

    } catch (error) {
      console.error('Password reset error:', error);
      setMessage({ type: 'error', content: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay visible" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '400px', padding: '0' }}>
        <div className="modal-header" style={{ padding: '1rem 1.5rem' }}>
          <h3 className="modal-title">Set New Password</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <form className="auth-form" onSubmit={handleSubmit} style={{ gap: '1rem' }}>
            
            <div>
              <label htmlFor="new-pass" className="auth-label">New Password</label>
              <input
                id="new-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirm-pass" className="auth-label">Confirm Password</label>
              <input
                id="confirm-pass"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
            </div>

            {message.content && (
              <div className={`auth-message ${message.type === 'success' ? 'auth-message-success' : 'auth-message-error'}`}>
                {message.content}
              </div>
            )}

            <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
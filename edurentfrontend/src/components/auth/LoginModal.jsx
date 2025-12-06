import React, { useState } from 'react';
import { loginUser } from "../../services/apiService";
import useAuth from '../../hooks/useAuth';
import '../../static/Auth.css'; // Reusing your existing auth styles
import '../../static/ProductDetailModal.css'; // Reusing modal styles

// We pass 'onClose' to close the modal
// We pass 'onSwitchToRegister' and 'onSwitchToForgot' to handle navigation between modals
export default function LoginModal({ isOpen, onClose, onSwitchToRegister, onSwitchToForgot }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  
  // Access the context function to update global user state immediately after login
  const { retryAuth } = useAuth();

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    if (!formData.email.trim() || !formData.password.trim()) {
        setMessage({ type: 'error', content: 'Please enter both email and password.' });
        return;
    }

    setLoading(true);

    try {
      const response = await loginUser({
        email: formData.email,
        password: formData.password
      });

      const { token, message: successMessage } = response.data;

      if (!token) throw new Error('Login failed: No token received.');

      // 1. Save token
      const userDataToStore = { token: token, email: formData.email };
      localStorage.setItem('eduRentUserData', JSON.stringify(userDataToStore));

      // 2. Update global Auth Context
      await retryAuth();

      // 3. Close Modal (User remains on the current page)
      setMessage({ type: 'success', content: successMessage || 'Login successful!' });
      
      // Short delay to show success message before closing
      setTimeout(() => {
        onClose();
        // Optional: Reload page if necessary, but Context update should handle UI changes
        // window.location.reload(); 
      }, 1000);

    } catch (error) {
      console.error('Login failed:', error);
      let errorMessage = 'Login failed. Please try again.';
      if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
              errorMessage = 'Invalid email or password.'; 
          } else {
              errorMessage = error.response.data?.message || errorMessage;
          }
      }
      setMessage({ type: 'error', content: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay visible" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '400px', padding: '0' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '1rem 1.5rem' }}>
          <h3 className="modal-title">Sign In</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          <form className="auth-form" onSubmit={handleSubmit} style={{ gap: '1rem' }}>
            
            {/* Email */}
            <div>
              <label htmlFor="modal-email" className="auth-label">Email</label>
              <input
                id="modal-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="auth-input"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="modal-password" className="auth-label">Password</label>
              <input
                id="modal-password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                disabled={loading}
              />
              <div style={{ textAlign: 'right', marginTop: '0.25rem' }}>
                <button 
                  type="button" 
                  onClick={onSwitchToForgot} 
                  className="auth-link" 
                  style={{ background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Feedback */}
            {message.content && (
              <div className={`auth-message ${message.type === 'success' ? 'auth-message-success' : 'auth-message-error'}`}>
                {message.content}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              className="auth-btn auth-btn-primary"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Footer / Switch */}
          <div className="auth-redirect-link" style={{ marginTop: '1.5rem' }}>
            Don't have an account?{' '}
            <button 
              onClick={onSwitchToRegister} 
              className="auth-link" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
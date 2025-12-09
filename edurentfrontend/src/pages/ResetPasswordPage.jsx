import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

// Shared styles for authentication pages
import '../static/Auth.css'; 

import eduRentLogo from '../assets/edurentlogo.png'; 

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get the token from the URL query parameter
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setMessage({ 
        type: 'error', 
        content: 'Invalid or missing reset token. Please request a new password reset.' 
      });
      return;
    }
    setToken(tokenFromUrl);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    // Basic checks for matching passwords and length
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
      // Call your Spring Boot backend API to reset password
      const response = await fetch('http://localhost:8080/api/v1/auth/reset-password', {
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
          content: data.message || 'Password successfully reset! Redirecting to login...' 
        });
        
        // Redirect to login page after success
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          content: data.error || 'Failed to reset password. The token may be expired or invalid.' 
        });
      }

    } catch (error) {
      console.error('Password update error:', error);
      setMessage({ type: 'error', content: 'Network error. Please check if the backend server is running.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      
      {/* Left Side: Branding and Logo */}
      <div className="auth-branding-panel">
        <Link to="/" className="auth-logo-wrapper">
          <img src={eduRentLogo} alt="Edu-Rent Logo" className="auth-logo" />
          <span className="auth-branding-text">Edu-Rent</span>
        </Link>
        <p className="auth-tagline">
          Almost there! Set your new password.
        </p>
      </div>

      {/* Right Side: Password Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-title">Create a New Password</h2>
          <p className="auth-redirect-link" style={{ marginTop: '-1rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Please set your new password to regain access to your account.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            
            {/* New Password Input */}
            <div>
              <label htmlFor="password" className="auth-label">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="auth-label">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
            </div>

            {/* Status Message Display */}
            {message.content && (
              <div
                className={`auth-message ${
                  message.type === 'success'
                    ? 'auth-message-success'
                    : message.type === 'info'
                    ? 'auth-message-info' 
                    : 'auth-message-error'
                }`}
              >
                {message.content}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Set New Password'}
              </button>
            </div>
          </form>

          {/* Fallback link to Login */}
          <div className="auth-redirect-link">
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
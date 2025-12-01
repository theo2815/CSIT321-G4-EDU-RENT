import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Shared styles for authentication pages
import '../static/Auth.css'; 

import eduRentLogo from '../assets/edurentlogo.png'; 

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Detect when Supabase finishes handling the recovery link from the email.
  // Once the 'PASSWORD_RECOVERY' event fires, the user is temporarily logged in to allow the update.
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMessage({ type: 'info', content: 'You are authenticated. Please enter your new password.' });
      }
    });
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    // Basic checks for matching passwords and length
    if (password !== confirmPassword) {
      setMessage({ type: 'error', content: 'Passwords do not match.' });
      return;
    }
    
    // TO DO: Implement stronger password validation here (e.g., require numbers, uppercase letters, or special characters).
    if (password.length < 6) { 
      setMessage({ type: 'error', content: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);

    try {
      // Send the new password to Supabase to update the user's record
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage({ type: 'success', content: 'Password updated successfully! Redirecting to login...' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Password update error:', error);
      if (error.message.includes("requires a valid session")) {
        setMessage({ type: 'error', content: 'Invalid or expired session. Please request a new password reset link.' });
      } else {
        setMessage({ type: 'error', content: error.message || 'Failed to update password.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      
      {/* Left Side: Branding and Logo */}
      <div className="auth-branding-panel">
        <img src={eduRentLogo} alt="Edu-Rent Logo" className="auth-logo" />
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
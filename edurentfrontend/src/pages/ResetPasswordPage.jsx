import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Import shared styles
import '../static/Auth.css'; // The ONLY CSS file needed

// Import your logo
import eduRentLogo from '../assets/edurentlogo.png'; 

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- Supabase Standard Flow: Handle token from URL fragment ---
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // The user is now authenticated temporarily to change their password.
        setMessage({ type: 'info', content: 'You are authenticated. Please enter your new password.' });
      }
    });
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

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
      // Use Supabase auth to update the password
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
      
      {/* --- Left Column (Branding) --- */}
      <div className="auth-branding-panel">
        <img src={eduRentLogo} alt="Edu-Rent Logo" className="auth-logo" />
        <p className="auth-tagline">
          Almost there! Set your new password.
        </p>
      </div>

      {/* --- Right Column (Form) --- */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-title">Create a New Password</h2>
          <p className="auth-redirect-link" style={{ marginTop: '-1rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Please set your new password to regain access to your account.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            
            {/* New Password */}
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

            {/* Confirm New Password */}
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

            {/* --- Message Display --- */}
            {message.content && (
              <div
                className={`auth-message ${
                  message.type === 'success'
                    ? 'auth-message-success'
                    : message.type === 'info'
                    ? 'auth-message-info' // Using our new style
                    : 'auth-message-error'
                }`}
              >
                {message.content}
              </div>
            )}

            {/* Button */}
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

          {/* Back to Login Link */}
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
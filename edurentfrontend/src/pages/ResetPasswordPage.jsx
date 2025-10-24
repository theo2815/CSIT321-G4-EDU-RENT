import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Import shared styles
import '../static/LoginPage.css'; // For layout
import '../static/RegisterPage.css'; // For form elements
import '../static/ForgotPassword.css'; // For specific styles

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // const location = useLocation();
  // const token = location.state?.token; // Get token if passed manually

  // --- Supabase Standard Flow: Handle token from URL fragment ---
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      // This listener fires when the user lands on this page
      // *after* clicking the email link. Supabase automatically
      // handles the token from the URL fragment (#access_token=...).
      if (event === 'PASSWORD_RECOVERY') {
        // The user is now authenticated temporarily to change their password.
         setMessage({ type: 'info', content: 'Enter your new password.' });
      }
       // You might want to handle cases where the token is invalid/expired
    });
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    if (password !== confirmPassword) {
      setMessage({ type: 'error', content: 'Passwords do not match.' });
      return;
    }
    if (password.length < 6) { // Example: Enforce minimum password length
       setMessage({ type: 'error', content: 'Password must be at least 6 characters.' });
       return;
    }

    setLoading(true);

    try {
      // Use Supabase auth to update the password
      // This only works if the user's session is authenticated via the email link/token.
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
       // Check if the error indicates an invalid session (user didn't come from email link)
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
    <div className="reset-password-page">
      {/* Left Column (Form) */}
      <div className="form-column">
        <div className="form-container-sm">
          <h2 className="page-title">Create a New Password</h2>
          <p className="page-subtitle">
            Please set your new password to regain access to your account.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* New Password */}
            <div>
              <label htmlFor="password" className="form-label">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
              />
            </div>

            {/* --- Message Display --- */}
            {message.content && (
              <div
                className={`form-message ${
                  message.type === 'success'
                    ? 'form-message-success'
                    : message.type === 'info'
                    ? 'form-message-info' // Add a style for info if needed
                    : 'form-message-error'
                }`}
              >
                {message.content}
              </div>
            )}

            {/* Button Group */}
            <div className="button-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Confirm'}
              </button>
               <Link to="/login" className="btn btn-secondary">
                 Back to Login
               </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column (Logo/Tagline) */}
      <div className="login-left-column"> {/* Reusing styling class */}
        <h1 className="login-logo">Edu-Rent</h1>
        <p className="login-tagline">
          Almost there! Set your new password.
        </p>
      </div>
    </div>
  );
}
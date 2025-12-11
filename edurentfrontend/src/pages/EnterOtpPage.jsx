import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 

// Import shared styles
import '../static/Auth.css'; 

import eduRentLogo from '../assets/edurentAllBlackTest.png'; 

export default function EnterOtpPage() {
  const [otp, setOtp] = useState(''); 
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve the email passed from the previous "Forgot Password" screen
  const email = location.state?.email; 

  // Helper function to send the email again if the user didn't receive it
  const handleResend = async () => {
      setMessage({ type: '', content: 'Resending instructions...' });
      setLoading(true);
      try {
        if (!email) {
          throw new Error("Email not found. Go back and try again.");
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage({ type: 'success', content: 'Instructions resent. Check your email.' });
      } catch (error) {
        setMessage({ type: 'error', content: error.message || 'Failed to resend.' });
      } finally {
        setLoading(false);
      }
  };

  const handleSubmit = (e) => { 
    e.preventDefault();
    setMessage({ type: '', content: '' });

    // basic validation to ensure we have the necessary data
    if (!email) {
        setMessage({ type: 'error', content: 'Session error. Please start the forgot password process again.' });
        return;
    }
    if (!otp) {
        setMessage({ type: 'error', content: 'Please enter the code/token.' });
        return;
    }

    setLoading(true);

    // --- TO DO: Connect this to the backend API to verify the token properly ---
    // Currently, this simulates a success and redirects.
    setMessage({ type: 'success', content: 'Code accepted! Redirecting to reset password...' });
      
    // Small delay to let the user read the success message
    setTimeout(() => {
      navigate('/reset-password', { state: { email, token: otp } });
    }, 1500);
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
          Securely reset your password.
        </p>
      </div>

      {/* Right Side: Input Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">

          <h2 className="auth-title">Enter Code</h2>
          <p className="auth-redirect-link" style={{ marginTop: '-1rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            We've sent instructions (including a code/token) to{' '}
            <strong>{email || 'your email'}</strong>.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            
            {/* Input field for the token */}
            <div>
              <label htmlFor="otp" className="auth-label">
                Code / Token from Email
              </label>
              <input
                id="otp"
                name="otp"
                type="text" 
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="auth-input"
                placeholder="Enter the code or token"
                disabled={loading}
              />
            </div>

            {/* Success or Error feedback message */}
            {message.content && (
              <div
                className={`auth-message ${
                  message.type === 'success'
                    ? 'auth-message-success'
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
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </form>

          {/* Links to resend the code or go back to login */}
          <div className="auth-redirect-link">
            Didn't get a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="auth-link"
              // Inline styles to make the button look like a text link
              style={{ 
                background: 'none', 
                border: 'none', 
                padding: 0, 
                margin: 0, 
                cursor: 'pointer', 
                verticalAlign: 'baseline',
                font: 'inherit'
              }}
            >
              Resend
            </button>
          </div>

          <div className="auth-redirect-link" style={{ marginTop: '0.5rem' }}>
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
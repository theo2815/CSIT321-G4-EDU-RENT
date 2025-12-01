import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 

// Shared styling for authentication pages
import '../static/Auth.css'; 

import eduRentLogo from '../assets/edurentlogo.png'; 

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });
    setLoading(true);

    try {
      // Trigger the password reset email via Supabase
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        // Ensure this URL is allowed in our Supabase Authentication settings
        // redirectTo: 'http://localhost:5173/reset-password', 
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', content: 'Password reset instructions sent! Check your email.' });
      
      // TO DO: Verify our authentication flow. Supabase defaults to sending a "Magic Link" 
      // that users click to reset passwords. If we want them to manually enter an OTP code 
      // on the next screen, we need to ensure our backend is configured for that.
      // Otherwise, this navigation might confuse users who are waiting for a link.
      setTimeout(() => {
        navigate('/enter-otp', { state: { email } }); 
      }, 2000);


    } catch (error) {
      console.error('Password reset error:', error);
      setMessage({ type: 'error', content: error.message || 'Failed to send reset instructions.' });
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
          Your Campus Marketplace for Students.
        </p>
      </div>

      {/* Right Side: Input Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          
          <h2 className="auth-title">Forgot your password?</h2>
          
          <p className="auth-redirect-link" style={{ marginTop: '-1rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Don’t worry! Just enter your email, and we’ll send you instructions to help you reset your password.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            
            {/* Email Input Field */}
            <div>
              <label htmlFor="email" className="auth-label">
                School Institution Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Feedback Message (Success or Error) */}
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
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </div>
          </form>
          
          {/* Navigation back to Login */}
          <div className="auth-redirect-link">
            Remembered your password?{' '}
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
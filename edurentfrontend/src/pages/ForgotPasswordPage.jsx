import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Import supabase client

// Import shared styles
import '../static/Auth.css'; // The ONLY CSS file needed

// Import your logo
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
      // Use Supabase auth to send password reset email
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        // You should configure this redirect URL in your Supabase project settings
        // redirectTo: 'http://localhost:5173/reset-password', 
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', content: 'Password reset instructions sent! Check your email.' });
      
      // Note: Supabase's default flow sends a link to click, not an OTP.
      // The user clicks the link in their email which takes them to your /reset-password page.
      // I am keeping your navigation logic, but you may want to review this flow.
      setTimeout(() => {
        // If you are building a custom OTP flow, this is fine.
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
      
      {/* --- Left Column (Branding) --- */}
      <div className="auth-branding-panel">
        <img src={eduRentLogo} alt="Edu-Rent Logo" className="auth-logo" />
        <p className="auth-tagline">
          Your Campus Marketplace for Students.
        </p>
      </div>

      {/* --- Right Column (Form) --- */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          
          <h2 className="auth-title">Forgot your password?</h2>
          
          {/* Subtitle text - reusing a class for muted text style */}
          <p className="auth-redirect-link" style={{ marginTop: '-1rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Don’t worry! Just enter your email, and we’ll send you instructions to help you reset your password.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            
            {/* Email */}
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

            {/* --- Message Display --- */}
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

            {/* Button */}
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
          
          {/* Back to Login Link */}
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
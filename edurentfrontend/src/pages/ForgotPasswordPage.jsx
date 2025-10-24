import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Import supabase client

// Import shared styles
import '../static/LoginPage.css'; // For layout
import '../static/RegisterPage.css'; // For form elements
import '../static/ForgotPassword.css'; // For specific styles

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
        // Optional: Redirect URL after the user clicks the link in the email
        // redirectTo: 'http://localhost:5173/reset-password',
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', content: 'Password reset instructions sent! Check your email.' });
      // Store email temporarily (e.g., in session storage or state management)
      // so the OTP page knows which email to verify against.
      // For simplicity here, we'll pass it in state during navigation.
      setTimeout(() => {
         // Supabase sends a link/token via email, not just an OTP for verification here.
         // Let's navigate to a page telling them to check email, or adapt OTP flow.
         // For now, let's assume we proceed to an OTP-like step (using the token later)
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
    <div className="forgot-password-page">
      {/* Left Column (Form) */}
      <div className="form-column">
        <div className="form-container-sm">
          <h2 className="page-title">Forgot your password?</h2>
          <p className="page-subtitle">
            Don’t worry! Just enter your email, and we’ll send you instructions to help you reset your password.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
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
                className="form-input"
                placeholder="you@example.com"
              />
            </div>

            {/* --- Message Display --- */}
            {message.content && (
              <div
                className={`form-message ${
                  message.type === 'success'
                    ? 'form-message-success'
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
                {loading ? 'Sending...' : 'Send Email'}
              </button>
              <Link to="/login" className="btn btn-secondary">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column (Logo/Tagline) - Reusing login styles */}
      <div className="login-left-column"> {/* We reuse the styling class */}
        <h1 className="login-logo">Edu-Rent</h1>
        <p className="login-tagline">
          Your Campus Marketplace for Students.
        </p>
      </div>
    </div>
  );
}
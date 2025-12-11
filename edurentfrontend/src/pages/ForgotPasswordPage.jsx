import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Shared styling for authentication pages
import '../static/Auth.css'; 

import eduRentLogo from '../assets/edurentAllBlackTest.png'; 

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
      // Call your Spring Boot backend API
      const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          content: data.message || 'If an account with that email exists, a password reset link has been sent to your email.' 
        });
        setEmail(''); // Clear the email field
      } else {
        setMessage({ 
          type: 'error', 
          content: data.error || 'Failed to send reset instructions. Please try again.' 
        });
      }

    } catch (error) {
      console.error('Password reset error:', error);
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
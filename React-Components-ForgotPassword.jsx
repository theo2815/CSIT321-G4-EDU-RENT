// ====================================
// Complete React Components for Forgot Password
// Add these to your frontend project
// ====================================

// FILE: ForgotPasswordPage.jsx
// Route: /forgot-password

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail('');
      } else {
        setMessage(data.error || 'An error occurred');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h1>Forgot Password</h1>
      <p>Enter your email address and we'll send you a link to reset your password.</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={isLoading}
        />
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      {message && (
        <div className={message.includes('error') ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}

      <button onClick={() => navigate('/login')} className="back-to-login">
        Back to Login
      </button>
    </div>
  );
}

// ====================================

// FILE: ResetPasswordPage.jsx
// Route: /reset-password
// IMPORTANT: This route MUST be exactly "/reset-password" to match the email link

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setMessage('Invalid or missing reset token. Please request a new password reset.');
      return;
    }
    setToken(tokenFromUrl);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Password successfully reset!');
        navigate('/login'); // Redirect to login page
      } else {
        setMessage(data.error || 'An error occurred');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-password-container">
        <h1>Invalid Reset Link</h1>
        <p>{message || 'This password reset link is invalid or has expired.'}</p>
        <button onClick={() => navigate('/forgot-password')}>
          Request New Reset Link
        </button>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <h1>Reset Your Password</h1>
      <p>Enter your new password below.</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password (min 6 characters)"
          required
          disabled={isLoading}
          minLength={6}
        />
        
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm New Password"
          required
          disabled={isLoading}
          minLength={6}
        />
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      {message && (
        <div className="error-message">
          {message}
        </div>
      )}
    </div>
  );
}

// ====================================

// Add to your Router configuration:
/*
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// In your routes:
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
*/

// ====================================

// Add to your Login page:
/*
<Link to="/forgot-password">Forgot Password?</Link>
*/

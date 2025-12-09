import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/apiService';
import '../static/Auth.css'; 
import eduRentLogo from '../assets/edurentlogo.png'; 

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Simple validation to ensure fields aren't empty before enabling the button
  const isFormValid = formData.email.trim() !== '' && formData.password.trim() !== '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    // Prevent submission if the form is incomplete
    if (!isFormValid) {
        setMessage({ type: 'error', content: 'Please enter both email and password.' });
        return;
    }

    setLoading(true);

    try {
      // Send credentials to the backend
      const response = await loginUser({
        email: formData.email,
        password: formData.password
      });

      const { token, message: successMessage } = response.data;

      // Double check that we actually got a token back
      if (!token) {
        throw new Error('Login failed: Server did not return a session token.');
      }

      // Save the session data so the user stays logged in
      const userDataToStore = {
        token: token,
        email: formData.email
      };
      localStorage.setItem('eduRentUserData', JSON.stringify(userDataToStore));

      // Notify user and prepare to redirect
      setMessage({ type: 'success', content: successMessage || 'Login successful! Redirecting...' });

      // Small delay to let the user see the success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Login failed:', error);
      
      // Handle specific error codes to give better feedback
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
              errorMessage = 'Invalid email or password.'; 
          } else {
              errorMessage = error.response.data?.message || errorMessage;
          }
      } else if (error.message) {
          errorMessage = error.message;
      }

      setMessage({ type: 'error', content: errorMessage });
      
      // Clear old session data on failure
      localStorage.removeItem('eduRentUserData'); 
    } finally {
      // Stop loading spinner
      setLoading(false);
    }
  };

  // --- NEW HANDLER: Guest Mode ---
  const handleGuestMode = () => {
    navigate('/dashboard');
  };

  return (
    <div className="auth-container">
      {/* Left side: Logo and branding */}
      <div className="auth-branding-panel">
        <Link to="/" className="auth-logo-wrapper">
          <img src={eduRentLogo} alt="Edu-Rent Logo" className="auth-logo" />
          <span className="auth-branding-text">Edu-Rent</span>
        </Link>
        <p className="auth-tagline">
          Your Campus Marketplace for Students. Rent, buy, and sell items all within your university community.
        </p>
      </div>

      {/* Right side: Login form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-title">Sign in to your account</h2>

          <form className="auth-form" onSubmit={handleSubmit}>

            {/* Email Input */}
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
                value={formData.email}
                onChange={handleChange}
                className="auth-input"
                disabled={loading} 
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                disabled={loading}
              />
            </div>
            
            {/* Password Recovery Link */}
            <div style={{marginTop: '-0.5rem'}}> 
               <Link to="/forgot-password" className="auth-link auth-link-right">
                Forgot password?
              </Link>
            </div>

            {/* Success or Error message display */}
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
                // Disable button if form is invalid or currently processing
                disabled={!isFormValid || loading}
                // Visual feedback for disabled state
                style={{ opacity: (!isFormValid || loading) ? 0.7 : 1 }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* --- NEW: Guest Mode Button --- */}
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                <span style={{ fontSize: '0.8rem' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            <button
                type="button"
                onClick={handleGuestMode}
                className="auth-btn"
                style={{ 
                    backgroundColor: 'transparent', 
                    border: '1px solid var(--border-color)', 
                    color: 'var(--text-color)',
                    fontWeight: '600'
                }}
            >
                Continue as Guest
            </button>
          </div>

          {/* Registration Link */}
          <div className="auth-redirect-link">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
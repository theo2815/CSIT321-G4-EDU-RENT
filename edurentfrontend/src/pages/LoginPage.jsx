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

  /**
   * FORM VALIDATION CHECK
   * We calculate this on every render to dynamically enable/disable the submit button.
   * This improves UX by preventing users from clicking "Login" with empty fields.
   */
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

    // Stop execution immediately if fields are empty to save network resources
    if (!isFormValid) {
        setMessage({ type: 'error', content: 'Please enter both email and password.' });
        return;
    }

    setLoading(true);

    try {
      // Attempt to authenticate with the backend
      const response = await loginUser({
        email: formData.email,
        password: formData.password
      });

      const { token, message: successMessage } = response.data;

      // SAFETY CHECK: Even if the status is 200, ensure we actually received a token.
      // This prevents the app from entering a "logged in" state without valid credentials.
      if (!token) {
        throw new Error('Login failed: Server did not return a session token.');
      }

      // Store the token and identifier for session persistence
      const userDataToStore = {
        token: token,
        email: formData.email
      };
      localStorage.setItem('eduRentUserData', JSON.stringify(userDataToStore));

      // Show success feedback and initiate navigation
      setMessage({ type: 'success', content: successMessage || 'Login successful! Redirecting...' });

      // Add a slight delay so the user can read the success message before the page changes
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Login failed:', error);
      
      // ERROR HANDLING STRATEGY
      // 1. Check for 401/403 specifically to give a clear "Wrong Password" message.
      // 2. Fallback to the server's error message if available.
      // 3. Default to a generic message if the server is unreachable.
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
      
      // Security: Clear any partial data to ensure a clean state for the next attempt
      localStorage.removeItem('eduRentUserData'); 
    } finally {
      // Always stop the loading spinner, regardless of success or failure
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Branding Panel: Displays the logo and mission statement to reinforce brand identity */}
      <div className="auth-branding-panel">
        <img src={eduRentLogo} alt="Edu-Rent Logo" className="auth-logo" />
        <p className="auth-tagline">
          Your Campus Marketplace for Students. Rent, buy, and sell items all within your university community.
        </p>
      </div>

      {/* Form Panel: Handles user interaction */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-title">Sign in to your account</h2>

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
                value={formData.email}
                onChange={handleChange}
                className="auth-input"
                disabled={loading} // Prevent edits while submitting
              />
            </div>

            {/* Password Input Field */}
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

            {/* Dynamic Status Message: Renders success (green) or error (red) alerts */}
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
                // Disable if form is invalid OR if currently loading to prevent double-submits
                disabled={!isFormValid || loading}
                // Visual feedback for disabled state
                style={{ opacity: (!isFormValid || loading) ? 0.7 : 1 }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Registration Redirection */}
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
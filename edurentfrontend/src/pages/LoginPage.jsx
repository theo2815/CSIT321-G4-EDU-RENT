import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/apiService'; // Placeholder import


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
    setLoading(true);

    try {
      const response = await loginUser({
        email: formData.email,
        password: formData.password
      });

      const { token, message: successMessage } = response.data;

      if (!token) {
        throw new Error(successMessage || 'Login failed, no token received.');
      }

      const userDataToStore = {
        token: token,
        email: formData.email
      };
      localStorage.setItem('eduRentUserData', JSON.stringify(userDataToStore));

      setMessage({ type: 'success', content: successMessage || 'Login successful! Redirecting...' });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Invalid email or password.';
      setMessage({ type: 'error', content: errorMessage });
      localStorage.removeItem('eduRentUserData');
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
          Your Campus Marketplace for Students. Rent, buy, and sell items all within your university community.
        </p>
      </div>

      {/* --- Right Column (Form) --- */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-title">Sign in to your account</h2>

          <form className="auth-form" onSubmit={handleSubmit}>

            {/* School Email */}
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

            {/* Password */}
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
            
            {/* Forgot Password Link */}
            <div style={{marginTop: '-0.5rem'}}> {/* Small layout adjustment */}
               <Link to="/forgot-password" className="auth-link auth-link-right">
                Forgot password?
              </Link>
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

            {/* Login Button */}
            <div>
              <button
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Sign Up Redirect */}
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
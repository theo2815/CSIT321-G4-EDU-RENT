import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/apiService'; // Placeholder import

// Import CSS
import '../static/LoginPage.css';
import '../static/RegisterPage.css'; // Shared form styles

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState({ type: '', content: '' });
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

    try {
      // --- LOGIN API CALL (Placeholder) ---
      // const response = await loginUser(formData);
      // const userData = response.data;

      // --- SIMULATION: Assume login is successful ---
      console.log('Simulating successful login for:', formData.email);

      // --- SIMULATION: Create dummy user data ---
      const dummyUserData = {
        fullName: (formData.email.split('@')[0] || 'Test') + ' User',
        email: formData.email,
        userId: Date.now(), // Fake ID
        token: 'fake-jwt-token-' + Date.now(), // Fake token
      };

      // --- SAVE USER DATA to localStorage ---
      localStorage.setItem('eduRentUserData', JSON.stringify(dummyUserData));
      // ------------------------------------

      setMessage({ type: 'success', content: 'Login successful! Redirecting...' });

      setTimeout(() => {
        navigate('/dashboard'); // Redirect to dashboard
      }, 1500);

    } catch (error) {
      console.error('Login failed:', error);
      setMessage({ type: 'error', content: 'Invalid email or password.' });
      localStorage.removeItem('eduRentUserData'); // Clear storage on error
    }
  };

  return (
    <div className="login-page">
      {/* Left Column */}
      <div className="login-left-column">
        <h1 className="login-logo">Edu-Rent</h1>
        <p className="login-tagline">
          Your Campus Marketplace for Students. Rent, buy, and sell items all within your university community.
        </p>
      </div>

      {/* Right Column */}
      <div className="login-right-column">
        <div className="login-form-container">
          <h2 className="login-title">Sign in to your account</h2>

          <form className="login-form" onSubmit={handleSubmit}>

            {/* School Email */}
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
                value={formData.email}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot password?
              </Link>
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

            {/* Login Button */}
            <div>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Login
              </button>
            </div>
          </form>

          <div className="signup-link-container">
            Don't have an account?{' '}
            <Link to="/register" className="signup-link">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
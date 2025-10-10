import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Accept handleLogin as a prop from App.js
function Login({ handleLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = (event) => {
    event.preventDefault();
    // In a real app, you'd call your backend API here.
    // For this project, we'll simulate a successful login.
    console.log("Login attempt with:", { email, password });

    // 1. Call the function from App.js to set login state to true
    handleLogin();

    // 2. Redirect the user to the dashboard
    navigate('/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">
            Login
          </button>
        </form>
        <p className="form-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
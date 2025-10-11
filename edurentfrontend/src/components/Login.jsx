import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api'; // Import the new login function
import logo from '../assets/edurentlogo.png';

function Login({ handleLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State to hold login error messages
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Reset error message on new submission

    try {
      const credentials = { email, password };
      // Call the API and wait for the response
      const response = await loginUser(credentials);
      
      console.log('Login successful:', response.data);

      // If the API call is successful (status 200 OK):
      handleLogin(response.data);      // Set the logged-in state in App.js
      navigate('/dashboard'); // Redirect to the dashboard

    } catch (err) {
      // If the API call fails (e.g., status 401 Unauthorized):
      console.error('Login failed:', err);
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="auth-wrapper">
            <div className="auth-visual">
                {/* Your Logo */}
                <img src={logo} alt="Edu-Rent Logo" className="auth-logo" />
                <h1 className="visual-title">Welcome Back!</h1>
                <p className="visual-subtitle">
                    We're thrilled to see you again. Log in to access your dashboard and pick up where you left off.
                </p>
                {/* Optional: Add an illustration here */}
                {/* <img src="/path/to/login-illustration.svg" alt="Login Illustration" className="visual-illustration" /> */}
            </div>

            <div className="auth-form-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2 className="auth-title-form">Sign In</h2>
                        <p className="auth-subtitle-form">Enter your credentials below</p>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        {error && <p className="error-message">{error}</p>}
                        
                        <div className="input-group">
                            <i className="input-icon fas fa-envelope"></i>
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <i className="input-icon fas fa-lock"></i>
                            <input
                                type="password"
                                placeholder="Password"
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
                        Don't have an account? <Link to="/register">Sign Up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}


export default Login;
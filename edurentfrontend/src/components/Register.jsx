import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api'; // Import the new API function
import logo from '../assets/edurentlogo.png';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = async (event) => {
    event.preventDefault();

    const userData = {
      name: name,
      email: email,
      password: password, // The backend receives this as plain text
    };

    try {
      // Call the API function and wait for it to complete
      const response = await registerUser(userData);
      console.log('Registration successful:', response.data);

      // Give feedback and redirect to login
      alert('Registration successful! Please log in with your new account.');
      navigate('/login');

    } catch (error) {
      console.error('Registration failed:', error);
      // The backend will send an error if the email is already taken
      alert('Registration failed. The email might already be in use.');
    }
  };

  return (
    <div className="auth-wrapper">
            <div className="auth-visual">
                {/* Your Logo */}
                <img src={logo} alt="Edu-Rent Logo" className="auth-logo" />
                <h1 className="visual-title">Join Our Community!</h1>
                <p className="visual-subtitle">
                    Create an account to explore our features and connect with our services. It's quick and easy!
                </p>
                {/* Optional: Add an illustration here */}
                {/* <img src="/path/to/register-illustration.svg" alt="Register Illustration" className="visual-illustration" /> */}
            </div>

            <div className="auth-form-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2 className="auth-title-form">Sign Up</h2>
                        <p className="auth-subtitle-form">Start your journey with us</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                             <i className="input-icon fas fa-user"></i>
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
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
                            Create Account
                        </button>
                    </form>
                    
                    <p className="form-link">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
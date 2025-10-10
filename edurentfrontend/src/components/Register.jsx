import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api'; // Import the new API function

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
    <div className="auth-container">
      <div className="auth-form">
        <h2>Create an Account</h2>
        <form onSubmit={handleSubmit}>
          {/* Form groups remain the same */}
          <div className="form-group">
            <label>Full Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            Create Account
          </button>
        </form>
        <p className="form-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
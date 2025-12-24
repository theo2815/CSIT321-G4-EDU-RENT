import React, { useState, useEffect } from 'react';
import { getSchools, registerUser } from '../services/apiService';
import { Link, useNavigate } from 'react-router-dom';

// Import the centralized authentication styles
import '../static/Auth.css'; 
import GenericDropdown from '../components/GenericDropdown'; 

import eduRentLogo from '../assets/edurentAllBlackTest.png'; 

export default function RegisterPage() {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    studentIdNumber: '',
    email: '',
    phoneNumber: '',
    address: '',
    passwordHash: '',
  });
  const [message, setMessage] = useState({ type: '', content: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  // Load the list of schools when the page opens so the user can select theirs
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await getSchools();
        setSchools(response.data);
      } catch (error) {
        console.error("Failed to fetch schools:", error);
        setMessage({ type: 'error', content: 'Could not load schools. Please refresh.' });
      }
    };
    fetchSchools();
  }, []);

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

    // TO DO: Add comprehensive validation here (e.g., check email format, password strength)
    // Currently only checks if passwords match and a school is selected.
    if (formData.passwordHash !== confirmPassword) {
      setMessage({ type: 'error', content: 'Passwords do not match!' });
      return;
    }
    if (!selectedSchoolId) {
      setMessage({ type: 'error', content: 'Please select your school.' });
      return;
    }

    setLoading(true); 

    // Prepare the data structure expected by the backend API
    const registrationData = {
        ...formData, 
        schoolId: selectedSchoolId 
    };

    try {
      // Send registration request
      const response = await registerUser(registrationData);

      const { token, message: successMessage } = response.data;

      if (!token) {
        throw new Error(successMessage || 'Registration successful, but no token received.');
      }

      console.log('Registration successful, token received:', token);

      // Save the session token immediately so the user doesn't have to log in again
      const userDataToStore = {
        token: token,
        email: formData.email 
      };
      localStorage.setItem('eduRentUserData', JSON.stringify(userDataToStore));

      setMessage({ type: 'success', content: successMessage || 'Registration successful! Redirecting to login...' });
      setTimeout(() => {
        navigate('/login'); 
      }, 2000);

    } catch (error) {
      console.error('Registration failed:', error);
      
      // Extract the error message from the API response or use a default one
      const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Registration failed. Please try again.'; 
      setMessage({ type: 'error', content: errorMessage });

    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="auth-container">
      
      {/* Left Side: Branding */}
      <div className="auth-branding-panel">
        <Link to="/" className="auth-logo-wrapper">
          <img src={eduRentLogo} alt="Edu-Rent Logo" className="auth-logo" />
          <span className="auth-branding-text">Edu-Rent</span>
        </Link>
        <p className="auth-tagline">
          Join the community! Easy sign-up to start renting, buying, or selling on campus.
        </p>
      </div>

      {/* Right Side: Registration Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-title">
            Create your account
          </h2>

          <form className="auth-form" onSubmit={handleSubmit}>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="auth-label">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="auth-input"
                disabled={loading}
              />
            </div>

            {/* School Dropdown */}
            <div>
              <label htmlFor="school" className="auth-label">
                School Institution
              </label>
              <GenericDropdown
                options={schools.map(s => ({ value: s.schoolId, label: s.name }))}
                selectedOption={selectedSchoolId}
                onSelect={(val) => setSelectedSchoolId(val)}
                placeholder="Select your school"
                width="100%"
              />
            </div>

            {/* Student ID */}
            <div>
              <label htmlFor="studentIdNumber" className="auth-label">
                Student ID
              </label>
              <input
                id="studentIdNumber"
                name="studentIdNumber"
                type="text"
                required
                value={formData.studentIdNumber}
                onChange={handleChange}
                className="auth-input"
                disabled={loading}
              />
            </div>

            {/* Email Address */}
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

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="auth-label">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="auth-input"
                disabled={loading}
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="auth-label">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                value={formData.address}
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
                name="passwordHash" 
                type="password"
                required
                value={formData.passwordHash}
                onChange={handleChange}
                className="auth-input"
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="auth-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
            </div>

            {/* Status Message Display */}
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="auth-redirect-link">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { getSchools, registerUser } from '../services/apiService';
import { Link, useNavigate } from 'react-router-dom';

// Import CSS files
import '../static/LoginPage.css'; // For the two-column layout
import '../static/RegisterPage.css'; // For the form styles

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
  const navigate = useNavigate();

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

    if (formData.passwordHash !== confirmPassword) {
      setMessage({ type: 'error', content: 'Passwords do not match!' });
      return;
    }
    if (!selectedSchoolId) {
      setMessage({ type: 'error', content: 'Please select your school.' });
      return;
    }

    try {
      const response = await registerUser(formData, selectedSchoolId);
      console.log('Registration successful:', response.data);
      setMessage({ type: 'success', content: 'Registration successful! Redirecting to login...' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Registration failed:', error);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response && (error.response.status === 400 || error.response.status === 409)) {
        errorMessage = 'This email or student ID is already registered.';
      }
      setMessage({ type: 'error', content: errorMessage });
    }
  };

  return (
    // Use the login-page class for the main flex container
    <div className="login-page">

      {/* Left Column (Form) */}
      {/* Use login-right-column class for styling */}
      <div className="login-right-column">
        {/* Use register-specific form container classes */}
        <div className="form-container-heading">
          <h2 className="form-title">
            Create your Edu-Rent Account
          </h2>
        </div>

        <div className="form-container">
          <div className="form-wrapper"> {/* Keep original form wrapper */}
            <form className="register-form" onSubmit={handleSubmit}>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="form-label">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* School Selection */}
              <div>
                <label htmlFor="school" className="form-label">
                  School Institution
                </label>
                <select
                  id="school"
                  name="school"
                  required
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="form-input"
                >
                  <option value="" disabled>Select your school</option>
                  {schools.map((school) => (
                    <option key={school.schoolId} value={school.schoolId}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student ID */}
              <div>
                <label htmlFor="studentIdNumber" className="form-label">
                  Student ID
                </label>
                <input
                  id="studentIdNumber"
                  name="studentIdNumber"
                  type="text"
                  required
                  value={formData.studentIdNumber}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

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

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="form-label">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="form-label">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
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
                  name="passwordHash"
                  type="password"
                  required
                  value={formData.passwordHash}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                />
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

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Create Account
                </button>
              </div>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <div className="divider-text-container">
                <span className="divider-text">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="link-container">
              <Link
                to="/login"
                className="btn btn-secondary"
              >
                Login
              </Link>
            </div>

          </div> {/* End form-wrapper */}
        </div> {/* End form-container */}
      </div> {/* End Left Column (Form) */}

      {/* Right Column (Logo and Text) */}
      {/* Use login-left-column class for styling */}
      <div className="login-left-column">
        <h1 className="login-logo">Edu-Rent</h1>
        <p className="login-tagline">
          Join the community! Easy sign-up to start renting, buying, or selling on campus.
        </p>
      </div>

    </div> /* End login-page */
  );
}
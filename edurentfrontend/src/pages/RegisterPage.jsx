import React, { useState, useEffect } from 'react';
import { getSchools, registerUser } from '../services/apiService';
import { Link, useNavigate } from 'react-router-dom';

// Import your new, shared CSS file
import '../static/Auth.css'; 
// You can now DELETE RegisterPage.css (and you already deleted LoginPage.css)

// Import your logo
import eduRentLogo from '../assets/edurentlogo.png'; 

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
  const [loading, setLoading] = useState(false); // Added loading state
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

    // --- Validation (keep as is) ---
    if (formData.passwordHash !== confirmPassword) {
      setMessage({ type: 'error', content: 'Passwords do not match!' });
      return;
    }
    if (!selectedSchoolId) {
      setMessage({ type: 'error', content: 'Please select your school.' });
      return;
    }
    // --- End Validation ---

    setLoading(true); // Start loading

    // --- Prepare data for API ---
    // Make sure the object keys match what apiService.js expects
    const registrationData = {
        ...formData, // Spread existing form data (fullName, studentIdNumber, email, etc.)
        schoolId: selectedSchoolId // Add schoolId here
        // Note: apiService will handle renaming passwordHash to password
    };
    // ---------------------------

    try {
      // --- Call API Service ---
      // Pass the combined data object
      const response = await registerUser(registrationData);
      // ------------------------

      // --- Handle Success ---
      // Assuming backend returns { token: '...', message: '...' }
      const { token, message: successMessage } = response.data;

      if (!token) {
        // Handle case where backend succeeds but sends no token (unlikely but safe)
        throw new Error(successMessage || 'Registration successful, but no token received.');
      }

      console.log('Registration successful, token received:', token);

      // --- SAVE TOKEN to localStorage ---
      // We store the token and maybe email for the next step (login/fetching user)
      const userDataToStore = {
        token: token,
        email: formData.email // Store email for potential future use
      };
      localStorage.setItem('eduRentUserData', JSON.stringify(userDataToStore));
      // ---------------------------------

      setMessage({ type: 'success', content: successMessage || 'Registration successful! Redirecting to login...' });
      setTimeout(() => {
        navigate('/login'); // Redirect to login after successful registration
      }, 2000);
      // --- End Success Handling ---

    } catch (error) {
      // --- Handle Errors ---
      console.error('Registration failed:', error);
      // Get specific error message from backend response if available
      const errorMessage = error.response?.data?.message || // Message from AuthResponse DTO
                           error.message || // General Axios or network error message
                           'Registration failed. Please try again.'; // Fallback
      setMessage({ type: 'error', content: errorMessage });
      // ----------------------

    } finally {
      setLoading(false); // Stop loading regardless of success/error
    }
  };

  return (
    <div className="auth-container">
      
      {/* --- Left Column (Branding) --- */}
      <div className="auth-branding-panel">
        <img src={eduRentLogo} alt="Edu-Rent Logo" className="auth-logo" />
        <p className="auth-tagline">
          Join the community! Easy sign-up to start renting, buying, or selling on campus.
        </p>
      </div>

      {/* --- Right Column (Form) --- */}
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

            {/* School Selection */}
            <div>
              <label htmlFor="school" className="auth-label">
                School Institution
              </label>
              <select
                id="school"
                name="school"
                required
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="auth-input" // The .auth-input class styles selects too
                disabled={loading}
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
                name="passwordHash" // Kept your original name for state
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

          {/* Login Redirect */}
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
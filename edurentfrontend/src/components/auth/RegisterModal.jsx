import React, { useState, useEffect } from 'react';
import { getSchools, registerUser } from '../../services/apiService';
import useAuth from '../../hooks/useAuth';
import GenericDropdown from '../GenericDropdown';
import '../../static/Auth.css';
import '../../static/ProductDetailModal.css';

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  
  const { retryAuth } = useAuth();

  // Load schools when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchSchools = async () => {
        try {
          const response = await getSchools();
          setSchools(response.data);
        } catch (error) {
          console.error("Failed to fetch schools:", error);
          setMessage({ type: 'error', content: 'Could not load schools.' });
        }
      };
      fetchSchools();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

    setLoading(true);

    try {
      const registrationData = { ...formData, schoolId: selectedSchoolId };
      const response = await registerUser(registrationData);
      const { token, message: successMessage } = response.data;

      if (!token) throw new Error(successMessage || 'Registration failed.');

      // Save session and update context
      localStorage.setItem('eduRentUserData', JSON.stringify({ token, email: formData.email }));
      await retryAuth();

      setMessage({ type: 'success', content: successMessage || 'Account created!' });
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed.';
      setMessage({ type: 'error', content: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay visible" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '450px', padding: '0', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ padding: '1rem 1.5rem' }}>
          <h3 className="modal-title">Create Account</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <form className="auth-form" onSubmit={handleSubmit} style={{ gap: '1rem' }}>
            
            {/* Form Fields Grid */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                    <label className="auth-label">Full Name</label>
                    <input name="fullName" value={formData.fullName} onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                    <label className="auth-label">School</label>
                    <GenericDropdown
                        options={schools.map(s => ({ value: s.schoolId, label: s.name }))}
                        selectedOption={selectedSchoolId}
                        onSelect={(val) => setSelectedSchoolId(val)}
                        placeholder="Select School"
                        width="100%"
                        disabled={loading} // GenericDropdown doesn't usually have disabled style, but good to pass if needed later
                    />
                </div>
                <div>
                    <label className="auth-label">Student ID</label>
                    <input name="studentIdNumber" value={formData.studentIdNumber} onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                    <label className="auth-label">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                    <label className="auth-label">Phone</label>
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                    <label className="auth-label">Address</label>
                    <input name="address" value={formData.address} onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                    <label className="auth-label">Password</label>
                    <input type="password" name="passwordHash" value={formData.passwordHash} onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                    <label className="auth-label">Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="auth-input" required />
                </div>
            </div>

            {message.content && (
              <div className={`auth-message ${message.type === 'success' ? 'auth-message-success' : 'auth-message-error'}`}>
                {message.content}
              </div>
            )}

            <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Register'}
            </button>
          </form>

          <div className="auth-redirect-link" style={{ marginTop: '1rem' }}>
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="auth-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight:'bold' }}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
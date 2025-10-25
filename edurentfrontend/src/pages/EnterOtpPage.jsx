import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Import supabase client

// Import shared styles
import '../static/Auth.css'; // The ONLY CSS file needed

// Import your logo
import eduRentLogo from '../assets/edurentlogo.png'; 

export default function EnterOtpPage() {
  const [otp, setOtp] = useState(''); // We'll treat the token as an "OTP"
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email; // Get email passed from previous page

  // Resend functionality (this logic is good)
  const handleResend = async () => {
      setMessage({ type: '', content: 'Resending instructions...' });
      setLoading(true);
      try {
        if (!email) {
          throw new Error("Email not found. Go back and try again.");
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage({ type: 'success', content: 'Instructions resent. Check your email.' });
      } catch (error) {
        setMessage({ type: 'error', content: error.message || 'Failed to resend.' });
      } finally {
        setLoading(false);
      }
  };

  const handleSubmit = (e) => { // No async needed for simulation
    e.preventDefault();
    setMessage({ type: '', content: '' });

    if (!email) {
        setMessage({ type: 'error', content: 'Session error. Please start the forgot password process again.' });
        return;
    }
    if (!otp) {
        setMessage({ type: 'error', content: 'Please enter the code/token.' });
        return;
    }

    setLoading(true);

    // ---
    // Your simulation logic
    // ---
    setMessage({ type: 'success', content: 'Code accepted! Redirecting to reset password...' });
      
    setTimeout(() => {
      // We navigate away, so no need to set loading to false.
      // The component will unmount.
      navigate('/reset-password', { state: { email, token: otp } });
    }, 1500);

    // The bug was here: `setLoading(false)` was running immediately.
    // By removing it, the button stays in its "loading" state until
    // the navigation happens, which is the correct user experience.
  };


  return (
    <div className="auth-container">
      
      {/* --- Left Column (Branding) --- */}
      <div className="auth-branding-panel">
        <img src={eduRentLogo} alt="Edu-Rent Logo" className="auth-logo" />
        <p className="auth-tagline">
          Securely reset your password.
        </p>
      </div>

      {/* --- Right Column (Form) --- */}
      <div className="auth-form-panel">
        <div className="auth-form-container">

          <h2 className="auth-title">Enter Code</h2>
          <p className="auth-redirect-link" style={{ marginTop: '-1rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            We've sent instructions (including a code/token) to{' '}
            <strong>{email || 'your email'}</strong>.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            
            {/* OTP Field */}
            <div>
              <label htmlFor="otp" className="auth-label">
                Code / Token from Email
              </label>
              <input
                id="otp"
                name="otp"
                type="text" // Supabase token is long
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="auth-input"
                placeholder="Enter the code or token"
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

            {/* Button */}
            <div>
              <button
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </form>

          {/* Resend & Back to Login Links */}
          <div className="auth-redirect-link">
            Didn't get a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="auth-link"
              // Inline styles to make the button look like a link
              style={{ 
                background: 'none', 
                border: 'none', 
                padding: 0, 
                margin: 0, 
                cursor: 'pointer', 
                verticalAlign: 'baseline',
                font: 'inherit'
              }}
            >
              Resend
            </button>
          </div>

          <div className="auth-redirect-link" style={{ marginTop: '0.5rem' }}>
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
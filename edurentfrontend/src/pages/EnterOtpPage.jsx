import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Import supabase client

// Import shared styles
import '../static/LoginPage.css'; // For layout
import '../static/RegisterPage.css'; // For form elements
import '../static/ForgotPassword.css'; // For specific styles

export default function EnterOtpPage() {
  const [otp, setOtp] = useState(''); // We'll treat the token as an "OTP"
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email; // Get email passed from previous page

  // Placeholder for resend functionality
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

  const handleSubmit = async (e) => {
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
    // In a real Supabase flow, verification happens when the user navigates
    // from the email link. The token is in the URL fragment (#access_token=...).
    // Supabase client library handles this automatically on the ResetPasswordPage.
    // We simulate a manual "OTP" check here for demonstration.
    // For this example, we'll just navigate, assuming the user arrived here
    // correctly (e.g., via the email link, and the token is implicitly valid).
    // ---

     // Simulate successful verification
      setMessage({ type: 'success', content: 'Code accepted! Redirecting to reset password...' });
       setTimeout(() => {
        // Pass email and the "OTP"/token to the reset page
         navigate('/reset-password', { state: { email, token: otp } });
       }, 1500);

    // If using Supabase verifyOtp (e.g., for phone):
    /*
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email, // or phone: phone,
        token: otp,
        type: 'recovery', // Type for password recovery OTP
      });

      if (error) throw error;

      setMessage({ type: 'success', content: 'OTP Verified! Redirecting...' });
      // The session is now typically updated, allowing password change
       setTimeout(() => {
         navigate('/reset-password');
       }, 1500);

    } catch (error) {
      console.error('OTP verification error:', error);
      setMessage({ type: 'error', content: error.message || 'Invalid or expired code.' });
    } finally {
      setLoading(false);
    }
    */
     setLoading(false); // Remove this if using the try/catch block
  };


  return (
    <div className="otp-page">
      {/* Left Column (Form) */}
      <div className="form-column">
        <div className="form-container-sm">
          <h2 className="page-title">Enter Code</h2>
          <p className="otp-info-text">
            We've sent instructions (including a code/token) to{' '}
            <strong>{email || 'your email'}</strong>.
            <br /> Didn't get it? Check your spam folder or resend.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* OTP Field */}
            <div>
              <label htmlFor="otp" className="form-label">
                Code / Token from Email
              </label>
              <input
                id="otp"
                name="otp"
                type="text" // Supabase token is long, not just numbers
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="form-input"
                placeholder="Enter the code or token"
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

            {/* Button Group */}
            <div className="button-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Submit / Verify'}
              </button>
              <button
                type="button" // Important: type="button" to prevent form submission
                onClick={handleResend}
                className="btn btn-secondary"
                disabled={loading}
              >
                Resend Email
              </button>
               <Link to="/login" className="btn btn-secondary">
                 Back to Login
               </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column (Logo/Tagline) */}
      <div className="login-left-column"> {/* Reusing styling class */}
        <h1 className="login-logo">Edu-Rent</h1>
        <p className="login-tagline">
          Securely reset your password.
        </p>
      </div>
    </div>
  );
}
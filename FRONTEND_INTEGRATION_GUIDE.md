# Frontend Integration Guide - Forgot Password

## Quick Reference for Frontend Developers

### 1. Create "Forgot Password" Page

**Location:** `/forgot-password` (or similar)

**Form Fields:**
- Email input
- Submit button

**API Call:**
```javascript
async function requestPasswordReset(email) {
  const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  
  if (response.ok) {
    alert(data.message); // "If an account with that email exists, a password reset link has been sent."
  } else {
    alert(data.error);
  }
}
```

**Example React Component:**
```jsx
import { useState } from 'react';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
```

---

### 2. Create "Reset Password" Page

**Location:** `/reset-password` (MUST match what's in backend config)

**Route:** `/reset-password?token=abc-123-def-456`

**Form Fields:**
- New Password input
- Confirm Password input
- Submit button

**API Call:**
```javascript
async function resetPassword(token, newPassword) {
  const response = await fetch('http://localhost:8080/api/v1/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      token, 
      newPassword 
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    alert(data.message); // "Password successfully reset..."
    // Redirect to login page
    window.location.href = '/login';
  } else {
    alert(data.error); // "Invalid or expired reset token"
  }
}
```

**Example React Component:**
```jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setMessage('Invalid reset link');
      return;
    }
    setToken(tokenFromUrl);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate('/login'); // Redirect to login
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  if (!token) {
    return <div>Invalid or missing reset token</div>;
  }

  return (
    <div>
      <h1>Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          required
        />
        <button type="submit">Reset Password</button>
      </form>
      {message && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
}
```

---

### 3. Add Link to Login Page

```jsx
<a href="/forgot-password">Forgot Password?</a>
```

---

## API Endpoints Summary

| Endpoint | Method | Request Body | Success Response |
|----------|--------|--------------|------------------|
| `/api/v1/auth/forgot-password` | POST | `{ "email": "user@example.com" }` | `{ "message": "..." }` |
| `/api/v1/auth/reset-password` | POST | `{ "token": "...", "newPassword": "..." }` | `{ "message": "..." }` |

---

## Important Notes

1. **Token from URL**: Extract the `token` query parameter from the URL in the reset password page
2. **Frontend URL**: Must be `http://localhost:5173` (or update backend config)
3. **CORS**: Already configured - frontend can make requests from `localhost:5173`
4. **Password Validation**: Minimum 6 characters (enforced by backend)
5. **Token Expiry**: 30 minutes - inform users to complete reset quickly

---

## Error Handling

Common error messages to handle:

- `"Invalid or expired reset token"` - Token is expired or doesn't exist
- `"This reset token has already been used"` - Token can only be used once
- `"Password must be at least 6 characters long"` - Validation error
- `"User not found"` - Rare, but possible if user was deleted

---

## Testing Flow

1. Go to `/forgot-password`
2. Enter email address
3. Click "Send Reset Link"
4. Check email inbox
5. Click link in email (opens `/reset-password?token=...`)
6. Enter new password
7. Submit form
8. Redirected to login page
9. Login with new password

---

**Need Help?** Check `FORGOT_PASSWORD_IMPLEMENTATION.md` for full backend documentation.

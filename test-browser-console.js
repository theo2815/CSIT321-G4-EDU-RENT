// ====================================
// Test Forgot Password in Browser Console
// ====================================
// Open browser console (F12) and paste these functions

// 1. Request Password Reset
async function testForgotPassword(email) {
  const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await response.json();
  console.log('Response:', data);
  return data;
}

// 2. Reset Password with Token
async function testResetPassword(token, newPassword) {
  const response = await fetch('http://localhost:8080/api/v1/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword })
  });
  const data = await response.json();
  console.log('Response:', data);
  return data;
}

// 3. Test Login
async function testLogin(email, password) {
  const response = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  console.log('Response:', data);
  return data;
}

// ====================================
// HOW TO USE:
// ====================================

// Step 1: Request password reset (replace with real email from your database)
// testForgotPassword('student@university.edu');

// Step 2: Check email inbox, get token from the link

// Step 3: Reset password (paste token from email)
// testResetPassword('TOKEN_FROM_EMAIL', 'NewPassword123');

// Step 4: Verify login works with new password
// testLogin('student@university.edu', 'NewPassword123');

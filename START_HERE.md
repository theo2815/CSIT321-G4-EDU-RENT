# 🚀 START HERE - Test Forgot Password Feature

## ✅ Everything is Ready!

Your forgot password feature is **fully implemented** in both backend and frontend!

---

## 📋 Quick Start (2 Steps)

### Step 1: Start Backend Server

**Open your IDE (IntelliJ/Eclipse/VS Code) and run:**
- File: `edurentbackend/src/main/java/com/edurent/crc/CrcApplication.java`
- Click "Run" or press F5

**OR if you prefer terminal:**
```powershell
# Navigate to backend folder
cd C:\Users\L24Y16W18\Desktop\EDURENT\edurentbackend

# If you have Maven installed:
mvn spring-boot:run

# Otherwise, use your IDE to run CrcApplication.java
```

**✅ Backend Ready When You See:**
```
Started CrcApplication in X.XXX seconds (JVM running for X.XXX)
```

---

### Step 2: Start Frontend

```powershell
# Open NEW terminal window
cd C:\Users\L24Y16W18\Desktop\EDURENT\edurentfrontend

# Install dependencies (first time only)
npm install

# Start React dev server
npm run dev
```

**✅ Frontend Ready:**
- Open: http://localhost:5173

---

## 🧪 Test the Forgot Password Flow

### 1. Go to Login Page
- Open: http://localhost:5173/login
- You'll see the "Forgot password?" link

### 2. Click "Forgot password?"
- Enter an email address that exists in your database
- Example: `student@university.edu`
- Click "Send Reset Link"

### 3. Check Email
- Go to the inbox of the email you entered
- Open the email from "EduRent Support" (`edurentnoreply@gmail.com`)
- Click the reset link or copy it

### 4. Reset Password
- The link opens: http://localhost:5173/reset-password?token=...
- Enter your new password (min 6 characters)
- Confirm the password
- Click "Set New Password"

### 5. Login with New Password
- You'll be redirected to login page
- Login with your email and NEW password
- Success! ✅

---

## 🎯 Alternative: Test with Browser Console

If you just want to test the API without email:

### Open browser console (F12) and run:

```javascript
// 1. Request password reset
fetch('http://localhost:8080/api/v1/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'student@university.edu' })
}).then(r => r.json()).then(console.log);

// 2. Check email for token, then reset password:
fetch('http://localhost:8080/api/v1/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    token: 'PASTE_TOKEN_FROM_EMAIL_HERE', 
    newPassword: 'NewPassword123' 
  })
}).then(r => r.json()).then(console.log);

// 3. Login with new password:
fetch('http://localhost:8080/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'student@university.edu', 
    password: 'NewPassword123' 
  })
}).then(r => r.json()).then(console.log);
```

---

## ✨ What's Been Updated

### Backend (edurentbackend):
- ✅ New API endpoint: `/api/v1/auth/forgot-password`
- ✅ New API endpoint: `/api/v1/auth/reset-password`
- ✅ Email sending via Gmail SMTP
- ✅ Password reset tokens (30min expiry)
- ✅ BCrypt password hashing

### Frontend (edurentfrontend):
- ✅ Updated `ForgotPasswordPage.jsx` - Now calls your backend API
- ✅ Updated `ResetPasswordPage.jsx` - Now calls your backend API
- ✅ Login page already has "Forgot password?" link

---

## 📧 Email Configuration

Emails are sent from:
- **From:** edurentnoreply@gmail.com
- **SMTP:** Gmail
- **App Password:** Already configured ✅

Users will receive professional emails with reset links that expire in 30 minutes.

---

## 🐛 Troubleshooting

### Backend won't start?
- Check if port 8080 is already in use
- Verify PostgreSQL/Supabase database connection
- Check `application.properties` for correct database credentials

### Frontend won't start?
```powershell
# Delete node_modules and reinstall
cd edurentfrontend
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

### Email not sending?
- Verify backend is running
- Check Spring Boot console for errors
- Ensure Gmail app password is correct in `application.properties`

### "Network error" messages?
- Backend must be running on http://localhost:8080
- Check if backend started successfully
- Look for errors in backend console

---

## 📝 Files Modified

**Backend:**
- `pom.xml` - Added Spring Mail
- `application.properties` - SMTP config
- New entities, repositories, services, and DTOs

**Frontend:**
- `ForgotPasswordPage.jsx` - Updated to use backend API
- `ResetPasswordPage.jsx` - Updated to use backend API

---

**Ready to test!** Just start both servers and try the forgot password flow! 🎉

**Questions?** Check these files:
- `FORGOT_PASSWORD_IMPLEMENTATION.md` - Full backend documentation
- `HOW_TO_START_SERVER.md` - Detailed server startup guide

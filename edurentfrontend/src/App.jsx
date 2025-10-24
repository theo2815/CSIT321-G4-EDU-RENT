import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from './pages/RegisterPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import EnterOtpPage from './pages/EnterOtpPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'

// 1. Import the DashboardPage
import DashboardPage from './pages/DashboardPage.jsx';

function App() {
  return (
    <Routes>
      {/* Authentication Routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/enter-otp" element={<EnterOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* 2. Add the Dashboard Route */}
      <Route path="/dashboard" element={<DashboardPage />} />

      {/* 3. Change default redirect to /dashboard (or /login if not authenticated) */}
      {/* For now, let's keep it simple and default to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" />} />

      {/* Add other routes like /browse, /profile etc. later */}

    </Routes>
  )
}

export default App
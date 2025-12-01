import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from './pages/RegisterPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import EnterOtpPage from './pages/EnterOtpPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import ForRentPage from './pages/ForRentPage.jsx';
import ForSalePage from './pages/ForSalePage.jsx';
import LikesPage from './pages/LikesPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import ListItemPage from './pages/ListItemPage.jsx';
import ManageListingsPage from './pages/ManageListingsPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import EditListingPage from './pages/EditListingPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import useAuth from './hooks/useAuth';

// helper component for the root path
const RootRoute = () => {
  const { userData, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return null;

  return userData ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      {/* --- Public Routes (Accessible by anyone) --- */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/enter-otp" element={<EnterOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* --- Protected Routes (Require Login) --- */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:profileId" element={<ProfilePage />} />

        <Route path="/settings" element={<Navigate to="/settings/profile" />} />
        <Route path="/settings/profile" element={<SettingsPage />} />
        <Route path="/settings/password" element={<SettingsPage />} />
        <Route path="/settings/notifications" element={<SettingsPage />} />
        <Route path="/settings/theme" element={<SettingsPage />} />

        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/for-rent" element={<ForRentPage />} />
        <Route path="/for-sale" element={<ForSalePage />} />
        <Route path="/likes" element={<LikesPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/list-item" element={<ListItemPage />} />
        <Route path="/manage-listings" element={<ManageListingsPage />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/edit-listing/:listingId" element={<EditListingPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<RootRoute />} />

    </Routes>
  )
}

export default App
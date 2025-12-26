import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

// Components & Context
import PageLoader from './components/PageLoader.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ToastProvider } from './context/ToastContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ListingCacheProvider } from './context/ListingCacheContext';

// Lazy-loaded Pages (Code-splitting for faster navigation)
const RegisterPage = React.lazy(() => import('./pages/RegisterPage.jsx'));
const LoginPage = React.lazy(() => import('./pages/LoginPage.jsx'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const EnterOtpPage = React.lazy(() => import('./pages/EnterOtpPage.jsx'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage.jsx'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage.jsx'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage.jsx'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage.jsx'));
const BrowsePage = React.lazy(() => import('./pages/BrowsePage.jsx'));
const ForRentPage = React.lazy(() => import('./pages/ForRentPage.jsx'));
const ForSalePage = React.lazy(() => import('./pages/ForSalePage.jsx'));
const LikesPage = React.lazy(() => import('./pages/LikesPage.jsx'));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage.jsx'));
const ListItemPage = React.lazy(() => import('./pages/ListItemPage.jsx'));
const ManageListingsPage = React.lazy(() => import('./pages/ManageListingsPage.jsx'));
const CategoryPage = React.lazy(() => import('./pages/CategoryPage.jsx'));
const EditListingPage = React.lazy(() => import('./pages/EditListingPage.jsx'));

// Helper for the root path: Redirect based on authentication status
const RootRoute = () => {
  const isLoggedIn = !!localStorage.getItem('eduRentUserData');
  return <Navigate to={isLoggedIn ? "/dashboard" : "/guest/dashboard"} replace />;
};

// Helper for legacy /dashboard route: Redirect guests to guest version
const DashboardRoute = () => {
  const isLoggedIn = !!localStorage.getItem('eduRentUserData');
  return isLoggedIn ? <DashboardPage /> : <Navigate to="/guest/dashboard" replace />;
};

// Helper for /profile/:username route: Redirect guests to guest version
const PublicProfileRoute = () => {
  const { username } = useParams();
  const isLoggedIn = !!localStorage.getItem('eduRentUserData');
  return isLoggedIn ? <ProfilePage /> : <Navigate to={`/guest/profile/${username}`} replace />;
};

// Helper for /guest/profile/:username route: Redirect logged-in users to regular version
const GuestProfileRoute = () => {
  const { username } = useParams();
  const isLoggedIn = !!localStorage.getItem('eduRentUserData');
  return isLoggedIn ? <Navigate to={`/profile/${username}`} replace /> : <ProfilePage />;
};

function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
      <ConfirmationProvider>
      <ListingCacheProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* --- Public Auth Pages  --- */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/enter-otp" element={<EnterOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* --- Guest Mode Routes (Visible to non-logged-in users) --- */}
          <Route path="/guest/dashboard" element={<DashboardPage />} />
          <Route path="/guest/browse" element={<BrowsePage />} />
          <Route path="/guest/for-rent" element={<ForRentPage />} />
          <Route path="/guest/for-sale" element={<ForSalePage />} />
          <Route path="/guest/category/:slug" element={<CategoryPage />} />
          <Route path="/guest/profile/:username" element={<GuestProfileRoute />} />

          {/* --- Logged-in User Routes (Redirect guests to /guest/* versions) --- */}
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/for-rent" element={<ForRentPage />} />
          <Route path="/for-sale" element={<ForSalePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          
          {/* Public Profile View - Redirects guests to /guest/profile/:username */}
          <Route path="/profile/:username" element={<PublicProfileRoute />} />

          {/* --- Protected Routes (Require Login) --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Settings & Account Management */}
            <Route path="/settings" element={<Navigate to="/settings/profile" />} />
            <Route path="/settings/profile" element={<SettingsPage />} />
            <Route path="/settings/password" element={<SettingsPage />} />
            <Route path="/settings/notifications" element={<SettingsPage />} />
            <Route path="/settings/theme" element={<SettingsPage />} />

            {/* User-Specific Features */}
            <Route path="/likes" element={<LikesPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/list-item" element={<ListItemPage />} />
            <Route path="/manage-listings" element={<ManageListingsPage />} />
            <Route path="/edit-listing/:listingId" element={<EditListingPage />} />
          </Route>

          {/* Default redirect to Dashboard */}
          <Route path="/" element={<RootRoute />} />
        </Routes>
      </Suspense>
      </ListingCacheProvider>
  </ConfirmationProvider>
    </ToastProvider>
    </ThemeProvider>
  )
}

export default App;
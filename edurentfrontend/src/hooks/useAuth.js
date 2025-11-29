import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/apiService';

export default function useAuth() {
  const navigate = useNavigate();

  /**
   * STATE INITIALIZATION
   * We use a "lazy initializer" (function inside useState) here.
   * This reads from localStorage immediately when the app launches.
   * Benefit: Prevents the "loading flash" or "login screen flicker" on refresh
   * because we assume the user is logged in if data exists in storage.
   */
  const [userData, setUserData] = useState(() => {
    try {
      const stored = localStorage.getItem('eduRentUserData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error parsing stored user data", error);
      return null;
    }
  });

  /**
   * LOADING STATE
   * If userData exists from the step above, we set isLoading to false immediately.
   * If userData is null, we keep loading true until we finish checking the backend.
   */
  const [isLoading, setIsLoading] = useState(!userData);
  const [error, setError] = useState(null);

  // Derive the display name safely from the current state (no need for separate state)
  const userName = userData?.fullName?.split(' ')[0] || userData?.email?.split('@')[0] || '';

  /**
   * LOGOUT FUNCTION
   * Clears local storage and state, then redirects to the login page.
   * Wrapped in useCallback to prevent unnecessary re-renders when passed to children.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('eduRentUserData');
    setUserData(null);
    navigate('/login');
  }, [navigate]);

  /**
   * FETCH USER / VALIDATE SESSION
   * 1. Checks if a token exists in storage.
   * 2. If it exists, calls the backend to get the freshest profile data.
   * 3. Merges the fresh data with the existing token and updates the UI.
   */
  const fetchUser = useCallback(async () => {
    const stored = localStorage.getItem('eduRentUserData');
    
    // If no data is found in storage, we are definitely not logged in.
    // Stop loading. Note: We do not auto-redirect here to allow public pages to use this hook.
    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      // Call the backend to verify the token is still valid
      const response = await getCurrentUser();
      const freshData = response.data;

      // The profile endpoint might not return the token, so we keep the one we have
      const currentToken = JSON.parse(stored).token;
      
      // Combine fresh database info with the existing session token
      const mergedData = { ...freshData, token: currentToken };

      setUserData(mergedData);
      
      // Update local storage so the data is fresh for the next refresh
      localStorage.setItem('eduRentUserData', JSON.stringify(mergedData));

    } catch (err) {
      console.error("Auth validation failed:", err);
      
      // If the error is 401 (Unauthorized) or 403 (Forbidden), the token is invalid.
      // In this case, we must log the user out.
      if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
      }
      // For other errors (like no internet), we keep the user logged in using cached data.
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Run the fetch logic once when the component mounts
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    userData,        // The full user object (contains token, id, email, etc.)
    userName,        // The derived display name
    isLoadingAuth: isLoading, // Boolean: Is the auth check still running?
    authError: error,         // Any error messages generated during auth
    logout,          // Function to log the user out
    retryAuth: fetchUser // Function to manually re-check auth (useful for error boundaries)
  };
}
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/apiService';

/**
 * Custom hook to manage user authentication state.
 * Fetches the current user on load and provides user data,
 * loading state, and a logout function.
 */
export default function useAuth() {
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start loading
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Define the logout function once and wrap in useCallback
  const logout = useCallback(() => {
    console.log('Logging out from useAuth hook...');
    localStorage.removeItem('eduRentUserData'); // Clear the token
    setUserData(null); // Clear user state
    setUserName('');
    navigate('/login'); // Redirect to login
  }, [navigate]); // Dependency

  // Define the fetch function once and wrap in useCallback
  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Check if a token exists first
    const storedData = localStorage.getItem('eduRentUserData');
    if (!storedData) {
      console.log("No user data found, redirecting to login.");
      setIsLoading(false);
      navigate('/login');
      return;
    }

    try {
      // Token exists, try to get user data from backend
      const response = await getCurrentUser();
      
      if (response.data && response.data.fullName) {
        setUserData(response.data);
        setUserName(response.data.fullName.split(' ')[0] || 'User');
      } else {
        // Token might be valid but data is weird
        throw new Error("Incomplete user data received.");
      }
    } catch (err) {
      console.error("Failed to fetch user:", err.message);
      let errorMsg = "Session expired or invalid. Please log in.";
      // Check for auth-specific errors
      if (err.message === "No authentication token found." || err.response?.status === 403 || err.response?.status === 401) {
          errorMsg = "Please log in to continue.";
          logout(); // Call logout to clear bad token and redirect
      } else {
          setError(errorMsg); // Set a generic error for other issues
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, logout]); // Dependencies for useCallback

  // Run the fetchUser function once when the hook is first used
  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // The dependency is the useCallback function

  // Return the state and functions for components to use
  return {
    userData,    // The full user object (or null)
    userName,    // Just the first name (or '')
    isLoadingAuth: isLoading, // Rename to avoid conflicts
    authError: error,       // Rename to avoid conflicts
    logout,      // The logout function
    retryAuth: fetchUser // Expose the fetch function to retry
  };
}
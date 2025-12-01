// This hooks manages user authentication status and session persistence
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/apiService';

export default function useAuth() {
  const navigate = useNavigate();

  // Initialize state from local storage immediately to avoid a login screen flash on refresh
  const [userData, setUserData] = useState(() => {
    try {
      const stored = localStorage.getItem('eduRentUserData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error parsing stored user data", error);
      return null;
    }
  });

  // If we already have data from storage, we aren't loading. Otherwise, wait for the backend check.
  const [isLoading, setIsLoading] = useState(!userData);
  const [error, setError] = useState(null);

  // Extract the first name or email prefix for display purposes
  const userName = userData?.fullName?.split(' ')[0] || userData?.email?.split('@')[0] || '';

  // Clear local storage and redirect to the login page
  const logout = useCallback(() => {
    localStorage.removeItem('eduRentUserData');
    setUserData(null);
    navigate('/login');
  }, [navigate]);

  // Validate the existing session with the backend and refresh user details
  const fetchUser = useCallback(async () => {
    const stored = localStorage.getItem('eduRentUserData');
    
    // If there is no data in storage, we definitely aren't logged in
    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      // Call the API to verify the token is still valid
      const response = await getCurrentUser();
      const freshData = response.data;

      // The profile endpoint might not return the token, so keep the one we have
      const currentToken = JSON.parse(stored).token;
      
      // Merge the fresh database info with our existing session token
      const mergedData = { ...freshData, token: currentToken };

      setUserData(mergedData);
      
      // Update local storage so the data is fresh for the next refresh
      localStorage.setItem('eduRentUserData', JSON.stringify(mergedData));

    } catch (err) {
      console.error("Auth validation failed:", err);
      
      // If the token is invalid or expired, force a logout
      if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
      }
      // For network errors, we keep the user logged in using the cached data
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Check auth status once when the component mounts
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    userData,        
    userName,        
    isLoadingAuth: isLoading, 
    authError: error,         
    logout,          
    retryAuth: fetchUser 
  };
}
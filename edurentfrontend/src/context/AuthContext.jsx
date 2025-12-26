import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/apiService';
import { AuthContext } from './ContextDefinitions';

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Initialize from localStorage immediately
  const [userData, setUserData] = useState(() => {
    try {
      const stored = localStorage.getItem('eduRentUserData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error parsing stored user data", error);
      return null;
    }
  });

  // Loading should be true initially to show skeleton during auth check
  const [isLoadingAuth, setIsLoadingAuth] = useState(!!userData);
  // const [authError, setAuthError] = useState(null); // Unused

  const logout = useCallback(() => {
    localStorage.removeItem('eduRentUserData');
    setUserData(null);
    navigate('/guest/dashboard');
  }, [navigate]);

  const fetchUser = useCallback(async () => {
    const stored = localStorage.getItem('eduRentUserData');
    
    if (!stored) {
      setIsLoadingAuth(false);
      return;
    }

    try {
      // Verify token with backend
      const response = await getCurrentUser();
      const freshData = response.data;
      const currentToken = JSON.parse(stored).token;
      
      const mergedData = { ...freshData, token: currentToken };
      setUserData(mergedData);
      localStorage.setItem('eduRentUserData', JSON.stringify(mergedData));
    } catch (err) {
      console.error("Auth validation failed:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, [logout]);

  // Run only once on mount, with a tiny delay to allow skeleton to render
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUser();
    }, 50);
    return () => clearTimeout(timer);
  }, [fetchUser]);

  const contextValue = useMemo(() => ({
    userData, 
    userName: userData?.fullName?.split(' ')[0] || '',
    isLoadingAuth, 
    logout, 
    retryAuth: fetchUser 
  }), [userData, isLoadingAuth, logout, fetchUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
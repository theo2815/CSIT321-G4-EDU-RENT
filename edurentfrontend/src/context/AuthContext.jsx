import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/apiService';

export const AuthContext = createContext();

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

  // Loading is true only if we have a token but haven't verified it yet
  const [isLoadingAuth, setIsLoadingAuth] = useState(!!userData);
  const [authError, setAuthError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('eduRentUserData');
    setUserData(null);
    navigate('/login');
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

  // Run only once on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ 
      userData, 
      userName: userData?.fullName?.split(' ')[0] || '',
      isLoadingAuth, 
      authError, 
      logout, 
      retryAuth: fetchUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
// This Component protects routes that require authentication
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = () => {
  // Get authentication status from useAuth hook
  const { userData, isLoadingAuth } = useAuth();

  // 1. While checking auth status, show a loading indicator
  // This prevents flickering on protected routes
  if (isLoadingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'var(--bg-color)' 
      }}>
        <div className="skeleton" style={{ width: '200px', height: '20px', borderRadius: '4px' }}></div>
      </div>
    );
  }

  // 2. If not authenticated, redirect to login
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  // 3. If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
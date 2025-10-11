import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import Sell from './components/Sell';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // --- 1. Add state to store the current user's data ---
  const [currentUser, setCurrentUser] = useState(null);

  // --- 2. Update handleLogin to accept and store the user object ---
  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login handleLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard user={currentUser} handleLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/sell"
           element={isLoggedIn ? <Sell user={currentUser} handleLogout={handleLogout} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
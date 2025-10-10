import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'; // Import the new CSS file

// Import components
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  // State to track if the user is logged in. Default is false.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Function to be passed to the Login component
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <Routes>
        {/* The default route "/" now redirects to the login page */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* The login page calls handleLogin on successful submission */}
        <Route path="/login" element={<Login handleLogin={handleLogin} />} />

        <Route path="/register" element={<Register />} />

        {/* Protected Route: The Dashboard
          - If the user is logged in, show the Dashboard.
          - If they are not logged in, redirect them to the login page.
        */}
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
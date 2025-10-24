import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Import the dashboard-specific CSS
import '../static/DashboardPage.css';

export default function DashboardPage() {
  const [userName, setUserName] = useState(''); // Start empty
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // --- Fetch User Data from localStorage ---
  useEffect(() => {
    const storedUserData = localStorage.getItem('eduRentUserData');

    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        const firstName = userData.fullName ? userData.fullName.split(' ')[0] : 'User';
        setUserName(firstName);
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        localStorage.removeItem('eduRentUserData');
        navigate('/login');
      }
    } else {
      // If no user data, redirect to login
      console.log('No user data found, redirecting to login.');
      navigate('/login');
    }
  }, [navigate]);

  // --- Event Handlers ---
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    setIsDropdownOpen(false); // Close dropdown

    // Clear user data from localStorage
    localStorage.removeItem('eduRentUserData');

    // Redirect to login page
    navigate('/login');
  };

  // Render null or a loading indicator until user name is fetched
  if (!userName) {
     return null; // Or <p>Loading...</p>
  }

  return (
    <div className="dashboard-page">
      {/* --- Top Header --- */}
      <header className="dashboard-header">
        {/* Left Side: Logo and Nav */}
        <div className="header-left">
          <Link to="/" className="header-logo">Edu-Rent</Link>
          <nav className="header-nav">
            <Link to="/browse" className="nav-link">Browse All Items</Link>
            <Link to="/for-rent" className="nav-link">For Rent</Link>
            <Link to="/for-sale" className="nav-link">For Sale</Link>
            <Link to="/categories" className="nav-link">All Categories</Link>
          </nav>
        </div>

        {/* Right Side: Icons, Button, Dropdown */}
        <div className="header-right">
          <div className="header-icons">
            <Link to="/likes" className="icon-link">❤️</Link>
            <Link to="/notifications" className="icon-link">🔔</Link>
            <Link to="/messages" className="icon-link">💬</Link>
          </div>
          <button className="sell-button" onClick={() => navigate('/list-item')}>
            Sell
          </button>
          <div className="user-dropdown">
            <button className="user-button" onClick={toggleDropdown}>
              <span className="user-avatar"></span> {/* Placeholder */}
              Hello, {userName} ▼
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>My Profile</Link>
                <Link to="/settings" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Settings</Link>
                <button onClick={handleLogout} className="dropdown-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- Body Section --- */}
      <main className="dashboard-body">
        {/* Hero Card */}
        <section className="content-card hero-card">
          <div className="hero-left">
            <h1 className="hero-title">Your Campus Marketplace for Students</h1>
            <p className="hero-subtitle">
              Edu-Rent makes it easy to rent, buy, and sell items within your university community. Find textbooks, electronics, and more — all at student-friendly prices.
            </p>
            <Link to="/browse" className="hero-button">Browse All Items</Link>
          </div>
          <div className="hero-right">
            <div className="hero-image-placeholder">Placeholder Image</div>
          </div>
        </section>

        {/* Explore by Category */}
        <section>
          <h2 className="section-title">Explore by Category</h2>
          <div className="category-grid">
            {/* Placeholder Category Cards */}
            <div className="category-card">Category 1</div>
            <div className="category-card">Category 2</div>
            <div className="category-card">Category 3</div>
            <div className="category-card">Category 4</div>
            <div className="category-card">Category 5</div>
          </div>
        </section>

        {/* Featured Items (Placeholder) */}
        <section>
          <h2 className="section-title">🌟 Featured Items</h2>
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Featured items will be displayed here.</p>
        </section>

        {/* All Listings (Placeholder) */}
        <section>
          <h2 className="section-title">📦 All Listings</h2>
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>All available listings will appear here.</p>
        </section>

        {/* Call to Action Card */}
        <section className="content-card cta-card">
          <h2 className="cta-title">Have items to sell or rent?</h2>
          <p className="cta-subtitle">
            Turn your unused items into cash by listing them on Edu-Rent. It’s easy, secure, and connects you directly with fellow students.
          </p>
          <Link to="/list-item" className="cta-button">Start Selling Today</Link>
        </section>
      </main>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import logo from '../assets/edurentlogo.png';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import Header from './Header';

function Dashboard({ user, handleLogout }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  // --- State to manage the dropdown visibility ---
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // This is a common pattern to close the dropdown if you click outside of it.
    const closeDropdown = () => setDropdownOpen(false);
    if (isDropdownOpen) {
      window.addEventListener('click', closeDropdown);
    }
    // Cleanup function to remove the listener
    return () => window.removeEventListener('click', closeDropdown);
  }, [isDropdownOpen]);


  const getFirstName = (fullName) => {
    if (!fullName) return 'Guest';
    return fullName.split(' ')[0];
  };

  // Prevents the window listener from firing when we click the button itself
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="dashboard-page">
      {/* --- Use the reusable Header component --- */}
      <Header user={user} handleLogout={handleLogout} />

      {/* --- Main Body Content (no changes here) --- */}
      <main className="dashboard-main">
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        
        <section className="hero-section">
          <h1>Your Campus Marketplace for Students</h1>
          <p>Find great deals on textbooks, electronics, and dorm essentials from fellow students right here on campus.</p>
          <button className="sell-button">Browse Listings</button>
        </section>

        <section className="listings-section">
          <h2 className="section-title">All Listings</h2>
          <div className="product-grid-placeholder">
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product.productId} className="product-card-placeholder">
                  Product Placeholder
                </div>
              ))
            ) : (
              <p>Loading listings...</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
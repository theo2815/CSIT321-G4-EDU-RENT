import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/edurentlogo.png';
import './Header.css'; // We will create this CSS file next

function Header({ user, handleLogout }) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const closeDropdown = () => setDropdownOpen(false);
    if (isDropdownOpen) {
      window.addEventListener('click', closeDropdown);
    }
    return () => window.removeEventListener('click', closeDropdown);
  }, [isDropdownOpen]);

  const getFirstName = (fullName) => {
    if (!fullName) return 'Guest';
    return fullName.split(' ')[0];
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="dashboard-header">
      <div className="header-logo">
        <Link to="/dashboard"><img src={logo} alt="Edu-Rent Logo" /></Link>
      </div>
      <nav className="header-nav">
        <a href="#study-materials">Study Materials</a>
        <a href="#electronics">Electronics</a>
        <a href="#dorm-essentials">Dorm Essentials</a>
        <a href="#clothing-uniforms">Clothing & Uniforms</a>
        <a href="#rental-items">Rental Items</a>
        <a href="#all" className="active"><i className="fas fa-th-large"></i> All Categories</a>
      </nav>
      <div className="header-user-actions">
        <Link to="/sell" className="sell-button">Sell an Item</Link>
        <div className="user-menu">
          <button className="user-menu-trigger" onClick={toggleDropdown}>
            <i className="fas fa-user-circle"></i>
            <span>Hello, {getFirstName(user?.name)}</span>
            <i className="fas fa-chevron-down" style={{ fontSize: '12px', marginLeft: '5px' }}></i>
          </button>
          <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
            <a href="#profile" className="dropdown-item"><i className="fas fa-user"></i> <span>My Profile</span></a>
            <a href="#notifications" className="dropdown-item">
              <div className="icon-wrapper">
                <i className="fas fa-bell"></i>
                <span className="notification-badge">3</span>
              </div>
              <span>Notifications</span>
            </a>
            <a href="#messages" className="dropdown-item"><i className="fas fa-comment"></i> <span>Messages</span></a>
            <div className="dropdown-divider"></div>
            <a href="#logout" className="dropdown-item" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> <span>Logout</span></a>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
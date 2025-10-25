import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CategoriesSidebar from './CategoriesSidebar';
import NotificationsPopup from './NotificationsPopup'; // <-- Import the new popup

// Import Header CSS
import '../static/Header.css';

// Import assets
// ... (logo, icons) ...
import eduRentLogo from '../assets/edurentlogo.png';
import heartIcon from '../assets/heart.png';
import notificationIcon from '../assets/notification.png';
import messengerIcon from '../assets/messenger.png';

export default function Header({ userName, searchQuery, onSearchChange, onLogout }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCategoriesSidebarVisible, setIsCategoriesSidebarVisible] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // <-- State for notification popup
  const navigate = useNavigate();

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const handleLogoutClick = () => { setIsDropdownOpen(false); onLogout(); };
  const openCategoriesSidebar = () => setIsCategoriesSidebarVisible(true);
  const closeCategoriesSidebar = () => setIsCategoriesSidebarVisible(false);

  // --- Notification Toggle Function ---
  const toggleNotifications = (event) => {
     event.preventDefault(); // Prevent default link behavior if it's a link
     event.stopPropagation(); // Prevent potential overlay clicks
     setIsNotificationsOpen(!isNotificationsOpen);
     setIsDropdownOpen(false); // Close user dropdown if open
     setIsCategoriesSidebarVisible(false); // Close categories if open
  };

  const closeNotifications = () => {
     setIsNotificationsOpen(false);
  };
  // ------------------------------------

  return (
    <>
      <header className="dashboard-header">
        {/* Left Side */}
        <div className="header-left">
          {/* ... Logo ... */}
          <Link to="/" className="header-logo-link"><img src={eduRentLogo} alt="Edu-Rent Logo" className="header-logo" /></Link>
          <nav className="header-nav">
            {/* ... Nav Links ... */}
            <Link to="/browse" className="nav-link">Browse All Items</Link>
            <Link to="/for-rent" className="nav-link">For Rent</Link>
            <Link to="/for-sale" className="nav-link">For Sale</Link>
            <button onClick={openCategoriesSidebar} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0' }}>All Categories</button>
          </nav>
        </div>

        {/* Center: Search Bar */}
        {/* ... Search ... */}
         <div className="header-search"> <input type="text" className="search-input" placeholder="Search items..." value={searchQuery} onChange={onSearchChange} aria-label="Search listings"/> </div>

        {/* Right Side */}
        <div className="header-right">
          <div className="header-icons">
            <Link to="/likes" className="icon-link" aria-label="Liked items">
              <img src={heartIcon} alt="Likes" className="header-icon" />
            </Link>
            {/* --- Notification Bell Button --- */}
            <button onClick={toggleNotifications} className="icon-link" aria-label="Notifications" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <img src={notificationIcon} alt="Notifications" className="header-icon" />
            </button>
            {/* ------------------------------- */}
            <Link to="/messages" className="icon-link" aria-label="Messages">
              <img src={messengerIcon} alt="Messages" className="header-icon" />
            </Link>
          </div>

          <button className="sell-button" onClick={() => navigate('/list-item')}>
            Sell
          </button>

          {/* User Dropdown */}
          <div className="user-dropdown">
             {/* ... User Button and Dropdown Menu ... */}
             <button className="user-button" onClick={toggleDropdown} aria-label="User menu"> <span className="user-avatar"></span> {userName && `Hello, ${userName}`} ▼ </button> {isDropdownOpen && ( <div className="dropdown-menu"> <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>My Profile</Link> <Link to="/settings" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Settings</Link> <button onClick={handleLogoutClick} className="dropdown-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1.25rem', fontSize: '0.9rem' }} aria-label="Logout" > Logout </button> </div> )}
          </div>
        </div>
      </header>

      {/* Render Sidebar */}
      <CategoriesSidebar
        isVisible={isCategoriesSidebarVisible}
        onClose={closeCategoriesSidebar}
      />
      {/* --- Render Notifications Popup --- */}
      <NotificationsPopup
         isVisible={isNotificationsOpen}
         onClose={closeNotifications}
      />
      {/* --------------------------------- */}
    </>
  );
}
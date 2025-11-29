// src/components/Header.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CategoriesSidebar from './CategoriesSidebar';
import NotificationsPopup from './NotificationsPopup';

// Import all necessary API functions
import { 
  getMyNotifications, 
  markNotificationAsRead, 
  deleteNotification,
  markAllNotificationsAsRead // <-- Added this import
} from '../services/apiService'; 

// Import assets
import '../static/Header.css';
import eduRentLogo from '../assets/edurentlogo.png';
import heartIcon from '../assets/heart.png';
import notificationIcon from '../assets/notification.png';
import messengerIcon from '../assets/messenger.png';
import defaultAvatar from '../assets/default-avatar.png'; // <-- Added this import

// The Header now accepts 'profilePictureUrl' to display the user's avatar
export default function Header({ 
  userName, 
  profilePictureUrl, // <-- New prop
  searchQuery, 
  onSearchChange, 
  onLogout, 
  onNotificationClick 
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCategoriesSidebarVisible, setIsCategoriesSidebarVisible] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  // --- Notification State ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationFilter, setNotificationFilter] = useState('all'); // 'all' or 'unread'
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Fetches notifications from the API based on the current filter
  const fetchNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await getMyNotifications(notificationFilter === 'unread');
      const notifs = response.data || [];

      const sortedNotifs = notifs.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setNotifications(sortedNotifs);

      // Update the bell count based on the filter
      if (notificationFilter === 'all') {
        setUnreadCount(notifs.filter(n => !n.isRead).length);
      } else {
        setUnreadCount(notifs.length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally   {
      setIsLoadingNotifications(false);
    }
  }, [notificationFilter]); // Re-runs when the filter changes

  // Fetches notifications when the user logs in or the filter changes
  useEffect(() => {
    if (userName) {
      fetchNotifications();
    }
  }, [userName, fetchNotifications]);

  // --- Notification Handlers (to pass down to the popup) ---
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      fetchNotifications(); // Refetch data
    } catch (error) {
      console.error(`Failed to mark notification ${notificationId} as read:`, error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      fetchNotifications(); // Refetch data
    } catch (error) {
      console.error(`Failed to delete notification ${notificationId}:`, error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotifications(); // Refetch data
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };
  // -------------------------------------------

  // Toggles the user profile dropdown
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  
  // Handles logout and closes the dropdown
  const handleLogoutClick = () => { 
    setIsDropdownOpen(false); 
    onLogout(); 
  };

  // Sidebar visibility handlers
  const openCategoriesSidebar = () => setIsCategoriesSidebarVisible(true);
  const closeCategoriesSidebar = () => setIsCategoriesSidebarVisible(false);

  // Toggles the notification popup
  const toggleNotifications = (event) => {
     event.preventDefault();
     event.stopPropagation();
     
     const aboutToOpen = !isNotificationsOpen;
     setIsNotificationsOpen(aboutToOpen);
     
     // Close other popups
     setIsDropdownOpen(false);
     setIsCategoriesSidebarVisible(false);

     // Reset filter and refetch when opening
     if (aboutToOpen) {
        setNotificationFilter('all');
        fetchNotifications();
     }
  };

  const closeNotifications = () => {
     setIsNotificationsOpen(false);
  };
  
  return (
    <>
      <header className="dashboard-header">
        {/* Left Side: Logo and Navigation */}
        <div className="header-left">
          <Link to="/" className="header-logo-link"><img src={eduRentLogo} alt="Edu-Rent Logo" className="header-logo" /></Link>
          <nav className="header-nav">
            <Link to="/browse" className="nav-link">Browse All Items</Link>
            <Link to="/for-rent" className="nav-link">For Rent</Link>
            <Link to="/for-sale" className="nav-link">For Sale</Link>
            <button onClick={openCategoriesSidebar} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0' }}>All Categories</button>
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div className="header-search">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search items..." 
            value={searchQuery} 
            onChange={onSearchChange} 
            aria-label="Search listings"
          />
        </div>

        {/* Right Side: Icons and User Menu */}
        <div className="header-right">
          <div className="header-icons">
            <Link to="/likes" className="icon-link" aria-label="Liked items">
              <img src={heartIcon} alt="Likes" className="header-icon" />
            </Link>
            
            <button 
              onClick={toggleNotifications} 
              className="icon-link notification-bell"
              aria-label="Notifications" 
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <img src={notificationIcon} alt="Notifications" className="header-icon" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            <Link to="/messages" className="icon-link" aria-label="Messages">
              <img src={messengerIcon} alt="Messages" className="header-icon" />
            </Link>
          </div>

          <button className="sell-button" onClick={() => navigate('/list-item')}>
            Sell
          </button>

          {/* User Dropdown */}
          <div className="user-dropdown">
             <button className="user-button" onClick={toggleDropdown} aria-label="User menu">
                <img
                  src={
                    profilePictureUrl 
                      ? (profilePictureUrl.startsWith('http') ? profilePictureUrl : `http://localhost:8080${profilePictureUrl}`)
                      : defaultAvatar
                  }
                  alt="Profile"
                  className="user-avatar"
                  style={{ objectFit: 'cover' }} 
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                />
               {userName && `Hello, ${userName}`} ▼ 
             </button>

             {isDropdownOpen && ( 
               <div className="dropdown-menu"> 
                 <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>My Profile</Link> 
                 <Link to="/settings" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Settings</Link> 
                 <button 
                   onClick={handleLogoutClick} 
                   className="dropdown-item" 
                   style={{ 
                     width: '100%', 
                     textAlign: 'left', 
                     background: 'none', 
                     border: 'none', 
                     cursor: 'pointer', 
                     padding: '0.75rem 1.25rem', 
                     fontSize: '0.9rem' 
                   }} 
                   aria-label="Logout" 
                 >
                   Logout
                 </button> 
               </div> 
             )}
          </div>
        </div>
      </header>

      {/* Render Sidebar (hidden by default) */}
      <CategoriesSidebar
        isVisible={isCategoriesSidebarVisible}
        onClose={closeCategoriesSidebar}
      />
      
      {/* --- UPDATED: NotificationsPopup moved here and 'onMarkAllAsRead' added --- */}
      <NotificationsPopup
        isVisible={isNotificationsOpen}
        onClose={closeNotifications}
        notifications={notifications}
        onRefresh={fetchNotifications}
        currentFilter={notificationFilter}
        onFilterChange={setNotificationFilter}
        onNotificationClick={onNotificationClick}
        onMarkAllAsRead={handleMarkAllAsRead} // <-- Prop added
        // These handlers are likely needed by your popup component
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
        isLoading={isLoadingNotifications}
      />
    </>
  );
}
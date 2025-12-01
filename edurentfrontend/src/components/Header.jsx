import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CategoriesSidebar from './CategoriesSidebar';
import NotificationsPopup from './NotificationsPopup';

// Functions for managing notifications from the backend
import { 
  getMyNotifications, 
  markNotificationAsRead, 
  deleteNotification,
  markAllNotificationsAsRead 
} from '../services/apiService'; 

// Static assets and styles
import '../static/Header.css';
import eduRentLogo from '../assets/edurentlogo.png';
import heartIcon from '../assets/heart.png';
import notificationIcon from '../assets/notification.png';
import messengerIcon from '../assets/messenger.png';
import defaultAvatar from '../assets/default-avatar.png'; 

// Main Header component which now supports displaying a custom profile picture
export default function Header({ 
  userName, 
  profilePictureUrl, 
  searchQuery, 
  onSearchChange, 
  onLogout, 
  onNotificationClick 
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCategoriesSidebarVisible, setIsCategoriesSidebarVisible] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  // State variables for managing the notification list and UI
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationFilter, setNotificationFilter] = useState('all'); // Can be 'all' or 'unread'
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Retrieve notifications from the server, sort them by date, and update the unread count
  const fetchNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await getMyNotifications(notificationFilter === 'unread');
      const notifs = response.data || [];

      const sortedNotifs = notifs.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setNotifications(sortedNotifs);

      // Update the red badge count based on what we are viewing
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
  }, [notificationFilter]); 

  // Refresh notifications whenever the user logs in
  useEffect(() => {
    if (userName) {
      fetchNotifications();
    }
  }, [userName, fetchNotifications]);

  // Helper functions passed to the popup to handle user actions
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      fetchNotifications(); // Refresh the list to show the new status
    } catch (error) {
      console.error(`Failed to mark notification ${notificationId} as read:`, error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      fetchNotifications(); // Refresh the list to remove the item
    } catch (error) {
      console.error(`Failed to delete notification ${notificationId}:`, error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotifications(); // Refresh to clear all unread statuses
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Switch the profile menu open or closed
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  
  // Close the menu and trigger the logout action
  const handleLogoutClick = () => { 
    setIsDropdownOpen(false); 
    onLogout(); 
  };

  // Simple handlers for the sidebar visibility
  const openCategoriesSidebar = () => setIsCategoriesSidebarVisible(true);
  const closeCategoriesSidebar = () => setIsCategoriesSidebarVisible(false);

  // Opens the notification panel while ensuring other menus are closed
  const toggleNotifications = (event) => {
     event.preventDefault();
     event.stopPropagation();
     
     const aboutToOpen = !isNotificationsOpen;
     setIsNotificationsOpen(aboutToOpen);
     
     // Close other popups to avoid clutter
     setIsDropdownOpen(false);
     setIsCategoriesSidebarVisible(false);

     // If opening, reset the filter to show everything and fetch fresh data
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
        {/* Logo and main navigation links */}
        <div className="header-left">
          <Link to="/" className="header-logo-link"><img src={eduRentLogo} alt="Edu-Rent Logo" className="header-logo" /></Link>
          <nav className="header-nav">
            <Link to="/browse" className="nav-link">Browse All Items</Link>
            <Link to="/for-rent" className="nav-link">For Rent</Link>
            <Link to="/for-sale" className="nav-link">For Sale</Link>
            <button onClick={openCategoriesSidebar} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0' }}>All Categories</button>
          </nav>
        </div>

        {/* Central search bar */}
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

        {/* Right side controls: Icons and Profile Menu */}
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

          {/* User Profile Dropdown */}
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

      {/* Categories Sidebar (hidden until toggled) */}
      <CategoriesSidebar
        isVisible={isCategoriesSidebarVisible}
        onClose={closeCategoriesSidebar}
      />
      
      {/* Notification Popup: This component handles the display and interaction logic */}
      <NotificationsPopup
        isVisible={isNotificationsOpen}
        onClose={closeNotifications}
        notifications={notifications}
        onRefresh={fetchNotifications}
        currentFilter={notificationFilter}
        onFilterChange={setNotificationFilter}
        onNotificationClick={onNotificationClick}
        onMarkAllAsRead={handleMarkAllAsRead} 
        
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
        isLoading={isLoadingNotifications}
      />
    </>
  );
}
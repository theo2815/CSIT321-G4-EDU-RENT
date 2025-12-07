import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CategoriesSidebar from './CategoriesSidebar';
import NotificationsPopup from './NotificationsPopup';

// Hooks for handling Auth state and the Auth Modals
import useAuth from '../hooks/useAuth';
import { useAuthModal } from '../context/AuthModalContext';

// API helpers to talk to the backend
import { 
  getMyNotifications, 
  markNotificationAsRead, 
  deleteNotification,
  markAllNotificationsAsRead 
} from '../services/apiService'; 

// Assets and Styles
import '../static/Header.css';
import eduRentLogo from '../assets/edurentlogo.png';
import heartIcon from '../assets/heart.png';
import notificationIcon from '../assets/notification.png';
import messengerIcon from '../assets/messenger.png';
import defaultAvatar from '../assets/default-avatar.png'; 

export default function Header({ 
  userName, 
  profilePictureUrl, 
  searchQuery, 
  onSearchChange, 
  onLogout, 
  onNotificationClick 
}) {
  // Grab the current user state and modal triggers from our custom hooks
  const { userData } = useAuth();
  const { openLogin } = useAuthModal();

  // UI State management
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCategoriesSidebarVisible, setIsCategoriesSidebarVisible] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const navigate = useNavigate();

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationFilter, setNotificationFilter] = useState('all'); // 'all' or 'unread'
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // --- Notification Logic ---

  // Let's fetch the notifications from the server, sort them by newest first, 
  // and figure out how many unread badges to show.
  const fetchNotifications = useCallback(async () => {
    // If there's no user, there's no point fetching
    if (!userData) return;

    setIsLoadingNotifications(true);
    try {
      const response = await getMyNotifications(notificationFilter === 'unread');
      const notifs = response.data || [];

      // Sort by date (newest on top)
      const sortedNotifs = notifs.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setNotifications(sortedNotifs);

      // specific logic for the red badge count
      if (notificationFilter === 'all') {
        setUnreadCount(notifs.filter(n => !n.isRead).length);
      } else {
        setUnreadCount(notifs.length);
      }
    } catch (error) {
      console.error("Oops, failed to fetch notifications:", error);
    } finally   {
      setIsLoadingNotifications(false);
    }
  }, [notificationFilter, userData]); 

  // Watch for changes: If the user logs in or changes filters, refresh the list.
  useEffect(() => {
    if (userData) {
      fetchNotifications();
    }
  }, [userData, fetchNotifications]);

  // Handlers for the popup actions
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      fetchNotifications(); // Update the UI to reflect the read status
    } catch (error) {
      console.error(`Couldn't mark notification ${notificationId} as read:`, error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      fetchNotifications(); // Remove it from the list
    } catch (error) {
      console.error(`Couldn't delete notification ${notificationId}:`, error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotifications(); // Clear all the badges
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // --- UI Handlers ---

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  
  const handleLogoutClick = () => { 
    setIsDropdownOpen(false); 
    onLogout(); 
  };

  const openCategoriesSidebar = () => setIsCategoriesSidebarVisible(true);
  const closeCategoriesSidebar = () => setIsCategoriesSidebarVisible(false);

  // Manage the notification bell click
  const toggleNotifications = (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      // Safety check: Only open if we are actually logged in
      if (!userData) return;

      const aboutToOpen = !isNotificationsOpen;
      setIsNotificationsOpen(aboutToOpen);
      
      // Clean up other open menus so the screen isn't cluttered
      setIsDropdownOpen(false);
      setIsCategoriesSidebarVisible(false);

      // If we are opening the panel, reset filters and grab fresh data
      if (aboutToOpen) {
        setNotificationFilter('all');
        fetchNotifications();
      }
  };

  const closeNotifications = () => setIsNotificationsOpen(false);

  // Route Protection: If they try to sell but aren't logged in, prompt the login modal
  const handleSellClick = () => {
    if (userData) {
      navigate('/list-item');
    } else {
      openLogin('/list-item');
    }
  };
  
  return (
    <>
      <header className="dashboard-header">
        {/* Left Section: Logo & Nav Links */}
        <div className="header-left">
          <Link to="/" className="header-logo-link">
            <img src={eduRentLogo} alt="Edu-Rent Logo" className="header-logo" />
          </Link>
          <nav className="header-nav">
            <Link to="/browse" className="nav-link">Browse All Items</Link>
            <Link to="/for-rent" className="nav-link">For Rent</Link>
            <Link to="/for-sale" className="nav-link">For Sale</Link>
            <button 
              onClick={openCategoriesSidebar} 
              className="nav-link" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0' }}
            >
              All Categories
            </button>
          </nav>
        </div>

        {/* Center Section: Search Bar */}
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

        {/* Right Section: Auth State Dependent */}
        <div className="header-right">

          <button className="sell-button" onClick={handleSellClick} style={{ marginRight: '1rem' }}>
            Sell
          </button>
          
          {/* SCENARIO 1: User is Logged In */}
          {userData ? (
            <>
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

              {/* Profile Dropdown */}
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
            </>
          ) : (
            /* SCENARIO 2: User is NOT Logged In (Show Login/Register) */
            <div className="auth-buttons" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <button 
                 onClick={() => navigate('/login')}
                 style={{ background: 'none', border: 'none', fontWeight: '600', color: 'var(--text-muted)', cursor: 'pointer' }}
               >
                 Log In
               </button>
               <button 
                 className="btn-primary-accent"
                 onClick={() => navigate('/register')}
                 style={{ padding: '0.5rem 1.2rem', borderRadius: '20px' }} // Pill shape for Register
               >
                 Register
               </button>
            </div>
          )}
        </div>
      </header>

      {/* Categories Sidebar */}
      <CategoriesSidebar
        isVisible={isCategoriesSidebarVisible}
        onClose={closeCategoriesSidebar}
      />
      
      {/* Notification Popup - Only render this if the user is actually logged in */}
      {userData && (
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
      )}
    </>
  );
}
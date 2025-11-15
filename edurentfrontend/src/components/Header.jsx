import React, { useState, useEffect, useCallback } from 'react'; // <-- Imported useCallback
import { Link, useNavigate } from 'react-router-dom';
import CategoriesSidebar from './CategoriesSidebar';
import NotificationsPopup from './NotificationsPopup';
// Import ALL notification functions
import { 
  getMyNotifications, 
  markNotificationAsRead, 
  deleteNotification 
} from '../services/apiService'; 

// Import Header CSS
import '../static/Header.css';

// Import assets
import eduRentLogo from '../assets/edurentlogo.png';
import heartIcon from '../assets/heart.png';
import notificationIcon from '../assets/notification.png';
import messengerIcon from '../assets/messenger.png';

export default function Header({ userName, searchQuery, onSearchChange, onLogout, onNotificationClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCategoriesSidebarVisible, setIsCategoriesSidebarVisible] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  // --- Notification State Management ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationFilter, setNotificationFilter] = useState('all'); // 'all' or 'unread'
  // ------------------------------------

  // --- Reusable Notification Fetch Function ---
  const fetchNotifications = useCallback(async () => {
    // We pass the filter to the API call
    try {
      const response = await getMyNotifications(notificationFilter === 'unread');
      const notifs = response.data || [];
      setNotifications(notifs);

      // Only update the main bell count when viewing 'all'
      // or if the filter is 'unread' (count is just the list length)
      if (notificationFilter === 'all') {
        setUnreadCount(notifs.filter(n => !n.isRead).length);
      } else {
        setUnreadCount(notifs.length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [notificationFilter]); // Re-run when the filter changes

  // --- Fetch notifications on load and when filter changes ---
  useEffect(() => {
    if (userName) { // Only fetch if logged in
      fetchNotifications();
    }
    // Optional: Polling
    // const intervalId = setInterval(fetchNotifications, 60000);
    // return () => clearInterval(intervalId);
  }, [userName, fetchNotifications]); // Re-run if filter changes

  // --- Notification Handlers (to pass down) ---
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

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const handleLogoutClick = () => { setIsDropdownOpen(false); onLogout(); };
  const openCategoriesSidebar = () => setIsCategoriesSidebarVisible(true);
  const closeCategoriesSidebar = () => setIsCategoriesSidebarVisible(false);

  // --- Notification Toggle Function ---
  const toggleNotifications = (event) => {
     event.preventDefault();
     event.stopPropagation();
     
     const aboutToOpen = !isNotificationsOpen;
     setIsNotificationsOpen(aboutToOpen);
     
     setIsDropdownOpen(false);
     setIsCategoriesSidebarVisible(false);

     // If opening, reset to 'all' filter and fetch
     if (aboutToOpen) {
        setNotificationFilter('all');
        fetchNotifications(); // This will use the 'all' filter
     }
  };

  const closeNotifications = () => {
     setIsNotificationsOpen(false);
  };
  
  return (
    <>
      <header className="dashboard-header">
        {/* Left Side */}
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
        <div className="header-search"> <input type="text" className="search-input" placeholder="Search items..." value={searchQuery} onChange={onSearchChange} aria-label="Search listings"/> </div>

        {/* Right Side */}
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

            {/* --- UPDATED: Pass all new props --- */}
            <NotificationsPopup
              isVisible={isNotificationsOpen}
              onClose={closeNotifications}
              notifications={notifications}
              onRefresh={fetchNotifications} // <-- Pass the refetch function
              currentFilter={notificationFilter}
              onFilterChange={setNotificationFilter} // <-- Pass the state setter
              onNotificationClick={onNotificationClick}
            />
            {/* ---------------------------------- */}

            <Link to="/messages" className="icon-link" aria-label="Messages">
              <img src={messengerIcon} alt="Messages" className="header-icon" />
            </Link>
          </div>

          <button className="sell-button" onClick={() => navigate('/list-item')}>
            Sell
          </button>

          {/* User Dropdown */}
          <div className="user-dropdown">
             <button className="user-button" onClick={toggleDropdown} aria-label="User menu"> <span className="user-avatar"></span> {userName && `Hello, ${userName}`} ▼ </button> {isDropdownOpen && ( <div className="dropdown-menu"> <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>My Profile</Link> <Link to="/settings" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Settings</Link> <button onClick={handleLogoutClick} className="dropdown-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1.25rem', fontSize: '0.9rem' }} aria-label="Logout" > Logout </button> </div> )}
          </div>
        </div>
      </header>

      {/* Render Sidebar */}
      <CategoriesSidebar
        isVisible={isCategoriesSidebarVisible}
        onClose={closeCategoriesSidebar}
      />
      
      
    </>
  );
}
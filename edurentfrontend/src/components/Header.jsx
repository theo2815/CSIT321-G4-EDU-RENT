import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CategoriesSidebar from './CategoriesSidebar';
import NotificationsPopup from './NotificationsPopup';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

// Hooks for handling Auth state and the Auth Modals
import useAuth from '../hooks/useAuth';
import { useAuthModal } from '../context/AuthModalContext';
import { useToast } from '../context/ToastContext';

// API helpers to talk to the backend
import { 
  getMyNotifications, 
  markNotificationAsRead,
  markNotificationAsUnread, 
  deleteNotification,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  getConversationsForUser,
} from '../services/apiService'; 

// Assets and Styles
import '../static/Header.css';
import eduRentLogo from '../assets/edurentAllBlackTest.png';
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
  const [unreadMsgCount, setUnreadMsgCount] = useState(0); // New State for Message Badge
  const [notificationFilter, setNotificationFilter] = useState('all'); // 'all' or 'unread'
  const [notifPrefs, setNotifPrefs] = useState({ all_notifications: true, likes: true, messages: true, email: false });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  const { showInfo } = useToast();
  const socketClientRef = useRef(null);
  
  const location = useLocation();
  const locationRef = useRef(location);
  const activeChatIdRef = useRef(null);

  // Keep location ref updated for the socket callback closure
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Listen for active chat changes from MessagesPage
  useEffect(() => {
    const handler = (e) => {
      activeChatIdRef.current = e.detail.id;
    };
    
    // Listen for when a message is read to update the count
    const readHandler = () => {
        fetchUnreadMessagesCount();
    };

    window.addEventListener('active-chat-change', handler);
    window.addEventListener('message-read', readHandler); // New listener
    
    return () => {
        window.removeEventListener('active-chat-change', handler);
        window.removeEventListener('message-read', readHandler);
    };
  }, []);

  // Fetch initial unread message count
  const fetchUnreadMessagesCount = async () => {
      if (!userData) return;
      try {
          const response = await getConversationsForUser(userData.userId);
          const conversations = response.data || [];
          const count = conversations.filter(c => c.isUnread).length;
          setUnreadMsgCount(count);
      } catch (error) {
          console.error("Failed to fetch unread messages count", error);
      }
  };

  useEffect(() => {
      fetchUnreadMessagesCount();
  }, [userData]);

  // --- Notification Logic ---

  // Real-time WebSocket connection for notifications
  useEffect(() => {
    if (!userData) return;

    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = Stomp.over(socket);
    stompClient.debug = null; // Disable debug logs
    socketClientRef.current = stompClient;

    stompClient.connect({}, () => {
      
      stompClient.subscribe(`/topic/user.${userData.userId}`, (message) => {
        const payload = JSON.parse(message.body);
        
        // Handle Real-time Like Notification
        if (payload.type === 'NEW_LIKE') {
          setNotifications(prev => {
             const existingIndex = prev.findIndex(n => n.notificationId === payload.notificationId);
             
             if (existingIndex !== -1) {
                 // Update existing: Move to top
                 const existingNotif = prev[existingIndex];
                 
                 // If resurrected (Read -> Unread), increment count
                 if (existingNotif.isRead && !payload.isRead) {
                     setUnreadCount(count => count + 1);
                 }
                 
                 const others = prev.filter(n => n.notificationId !== payload.notificationId);
                 return [payload, ...others];
             } else {
                 // New notification
                 setUnreadCount(count => count + 1);
                 return [payload, ...prev];
             }
          });
          showInfo("New notification received");
        } 
        else if (payload.type === 'NEW_MESSAGE') {
          // Extract conversation ID from linkUrl (e.g. "/messages/15")
          const notifConvId = payload.linkUrl ? parseInt(payload.linkUrl.split('/').pop(), 10) : null;
          
          const isOnMessagesPage = locationRef.current.pathname === '/messages';
          const isViewingSameChat = activeChatIdRef.current === notifConvId;

          // If user is currently looking at this conversation, suppress notification completely
          if (isOnMessagesPage && isViewingSameChat) {
             // Mark as read immediately in the background so it doesn't stay unread
             markNotificationAsRead(payload.notificationId);
             return;
          }

          // Increment message badge if not viewing the chat
          setUnreadMsgCount(prev => prev + 1);

          // 1. Show Toast
          // Strip HTML tags for clean toast text
          const plainText = payload.notificationContent.replace(/<[^>]*>?/gm, '');
          showInfo(plainText);

          // 2. Add or Update Notification in Dropdown List
          const newNotification = {
             notificationId: payload.notificationId,
             type: payload.type,
             content: payload.notificationContent,
             linkUrl: payload.linkUrl,
             isRead: payload.isRead,
             createdAt: payload.createdAt
          };
          
          setNotifications(prev => {
             // Check if this specific notification ID already exists
             const existingIndex = prev.findIndex(n => n.notificationId === newNotification.notificationId);
             
             if (existingIndex !== -1) {
                 const existingNotif = prev[existingIndex];
                 
                 // If it was previously read and now we are updating it to be unread (resurrecting), increment count
                 if (existingNotif.isRead && !newNotification.isRead) {
                     setUnreadCount(count => count + 1);
                 }

                 // Remove the old version and add the new one to the top
                 const others = prev.filter(n => n.notificationId !== newNotification.notificationId);
                 return [newNotification, ...others];
             } else {
                 // Completely new notification
                 if (!newNotification.isRead) {
                    setUnreadCount(count => count + 1);
                 }
                 return [newNotification, ...prev];
             }
          });
        }else if (payload.type === 'NEW_REVIEW') {
           // 1. Show Toast (Strip HTML tags for clean text)
           const plainText = payload.content ? payload.content.replace(/<[^>]*>?/gm, '') : 'New review received';
           showInfo(plainText);

           // 2. Update Dropdown with Stock-up Logic
           setNotifications(prev => {
             const existingIndex = prev.findIndex(n => n.notificationId === payload.notificationId);
             
             if (existingIndex !== -1) {
                 // Update existing: Move to top
                 const existingNotif = prev[existingIndex];
                 
                 // If resurrected (Read -> Unread), increment count
                 if (existingNotif.isRead && !payload.isRead) {
                     setUnreadCount(count => count + 1);
                 }
                 
                 const others = prev.filter(n => n.notificationId !== payload.notificationId);
                 return [payload, ...others];
             } else {
                 // New notification
                 setUnreadCount(count => count + 1);
                 return [payload, ...prev];
             }
          });
        }else if (payload.type === 'REVIEW_DELETED') {
           // 1. Show Toast
           const plainText = payload.content ? payload.content.replace(/<[^>]*>?/gm, '') : 'Review deleted';
           showInfo(plainText);
           
           // 2. Add to list (Standard append, no stock-up needed for deletions)
           setNotifications(prev => [payload, ...prev]);
           setUnreadCount(prev => prev + 1);
        }else if (payload.type === 'TRANSACTION_COMPLETED') {
           // 1. Show Toast
           const plainText = payload.content ? payload.content.replace(/<[^>]*>?/gm, '') : 'Item sold to you!';
           showInfo(plainText);
           
           // 2. Add to list
           setNotifications(prev => [payload, ...prev]);
           setUnreadCount(prev => prev + 1);
        }else if (['TRANSACTION_COMPLETED', 'TRANSACTION_COMPLETED_SELLER', 'RENTAL_STARTED_RENTER', 'RENTAL_STARTED_OWNER', 'RENTAL_REMINDER'].includes(payload.type)) {
           // 1. Show Toast
           const plainText = payload.content ? payload.content.replace(/<[^>]*>?/gm, '') : 'New Notification';
           showInfo(plainText);
           
           // 2. Add to list
           setNotifications(prev => [payload, ...prev]);
           setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => {
      console.error("Notification socket error:", err);
    });

    return () => {
      if (socketClientRef.current && socketClientRef.current.connected) {
        socketClientRef.current.disconnect();
      }
    };
  }, [userData, showInfo]);

  // Let's fetch the notifications from the server, sort them by newest first, 
  // and figure out how many unread badges to show.
  const fetchNotifications = useCallback(async () => {
    // If there's no user, there's no point fetching
    if (!userData) return;

    setIsLoadingNotifications(true);
    try {
      // Load preferences first
      const prefs = await getNotificationPreferences(userData.userId);
      setNotifPrefs(prefs);

      const response = await getMyNotifications(notificationFilter === 'unread');
      const notifs = response.data || [];

      // Sort by date (newest on top)
      const sortedNotifs = notifs.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      // Filter by preferences
      const allowAll = !!prefs.all_notifications;
      const allowLikes = !!prefs.likes;
      const allowMessages = !!prefs.messages;
      const filtered = allowAll
        ? sortedNotifs
        : sortedNotifs.filter(n => {
            if (n.type === 'NEW_LIKE') return allowLikes;
            if (n.type === 'NEW_MESSAGE') return allowMessages;
            // default notifications respect all_notifications only
            return allowAll;
          });
      setNotifications(filtered);

      // specific logic for the red badge count
      if (notificationFilter === 'all') {
        setUnreadCount(filtered.filter(n => !n.isRead).length);
      } else {
        setUnreadCount(filtered.length);
      }
    } catch (error) {
      console.error("Oops, failed to fetch notifications:", error);
    } finally   {
      setIsLoadingNotifications(false);
    }
  }, [notificationFilter, setNotifPrefs, userData]); 

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

  const handleMarkAsUnread = async (notificationId) => {
    try {
      await markNotificationAsUnread(notificationId);
      fetchNotifications(); 
    } catch (error) {
      console.error(`Couldn't mark notification ${notificationId} as unread:`, error);
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
            <span className="header-logo-text">Edu-Rent</span>
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

                <Link to="/messages" className="icon-link notification-bell" aria-label="Messages">
                  <img src={messengerIcon} alt="Messages" className="header-icon" />
                  {unreadMsgCount > 0 && (
                    <span className="notification-badge">{unreadMsgCount}</span>
                  )}
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
          onMarkAsUnread={handleMarkAsUnread}
          onDelete={handleDelete}
          isLoading={isLoadingNotifications}
        />
      )}
    </>
  );
}
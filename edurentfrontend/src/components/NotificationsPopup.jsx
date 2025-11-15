// src/components/NotificationsPopup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsUnread // <-- Added
} from '../services/apiService'; // API functions for notification actions

// Import CSS
import '../static/NotificationsPopup.css';
import '../static/CategoriesSidebar.css'; // Reusing close button style

// Controls how many notifications are loaded per page
const NOTIFICATIONS_PER_PAGE = 5;

/**
 * A popup component to display, filter, and manage notifications.
 *
 * This component is controlled by its parent (Header) and receives
 * functions to handle data fetching and state updates.
 */
export default function NotificationsPopup({
  isVisible, // Whether the popup is open
  onClose, // Function to close the popup
  notifications, // The list of notification objects to display
  onRefresh, // Function to tell Header to refetch data after an action
  currentFilter, // The currently active filter ('all' or 'unread')
  onFilterChange, // Function to set the filter in Header
  onNotificationClick
}) {
  // State for pagination
  const [visibleCount, setVisibleCount] = useState(NOTIFICATIONS_PER_PAGE);
  // State to track which 3-dot menu is open (by notificationId)
  const [activeDropdown, setActiveDropdown] = useState(null);
  // State for the new 3-dot menu in the header
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Shows more notifications from the list
  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + NOTIFICATIONS_PER_PAGE);
  };

  // --- Event Handlers ---

  // Called when clicking 'All' or 'Unread'
  const handleFilterClick = (filter) => {
    onFilterChange(filter); // Tell Header to change the filter
    setVisibleCount(NOTIFICATIONS_PER_PAGE); // Reset pagination
    setActiveDropdown(null); // Close any open menus
  };

  // Called from the new header 3-dot menu
  const handleMarkAllReadClick = async (e) => {
    e.stopPropagation();
    setIsHeaderMenuOpen(false); // Close menu
    try {
      await markAllNotificationsAsRead();
      onRefresh(); // Tell Header to refetch
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Called from the item 3-dot menu
  const handleMarkAsReadClick = async (e, notificationId) => {
    e.stopPropagation(); // Stop click from bubbling to the item
    setActiveDropdown(null); // Close dropdown
    try {
      await markNotificationAsRead(notificationId);
      onRefresh(); // Tell Header to refetch
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // NEW: Called from the item 3-dot menu
  const handleMarkAsUnreadClick = async (e, notificationId) => {
    e.stopPropagation();
    setActiveDropdown(null);
    try {
      await markNotificationAsUnread(notificationId);
      onRefresh(); // Tell Header to refetch
    } catch (error) {
      console.error("Failed to mark as unread:", error);
    }
  };

  // Called from the item 3-dot menu
  const handleDeleteClick = async (e, notificationId) => {
    e.stopPropagation();
    setActiveDropdown(null);
    try {
      await deleteNotification(notificationId);
      onRefresh(); // Tell Header to refetch
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // Opens/closes the 3-dot menu for a specific notification
  const toggleDropdown = (e, notificationId) => {
    e.stopPropagation(); // Stop click from propagating to the item link
    setActiveDropdown(prev => (prev === notificationId ? null : notificationId));
  };

  // Handles clicking on the main body of a notification item
  const handleItemClick = async (notification) => {
    // 1. Mark as read (if needed)
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.notificationId);
        onRefresh();
      } catch (error) {
        console.error("Failed to mark as read on click:", error);
        // Continue anyway
      }
    }
        
    // 2. ---  Call the parent function ---
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    // ------------------------------------
    
    // 4. Close the popup
    onClose();
  };


  // --- Data & Render Helpers ---

  const displayedNotifications = notifications.slice(0, visibleCount);
  const hasMore = notifications.length > visibleCount;

  const renderNotificationText = (notification) => {
    return <span dangerouslySetInnerHTML={{ __html: notification.content }} />;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_LIKE': return '❤️';
      case 'NEW_MESSAGE': return '💬';
      default: return '🔔';
    }
  };
  
  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      {/* Overlay blocks background interaction */}
      {isVisible && <div className="notifications-popup-overlay" onClick={onClose}></div>}

      {/* Main popup container */}
      <div
        className={`notifications-popup ${isVisible ? 'visible' : ''}`}
        aria-label="Notifications pop-up"
        aria-hidden={!isVisible}
        role="dialog"
      >
        {/* --- UPDATED: Popup Header with 3-dot menu --- */}
        <div className="popup-header">
          <h2 className="popup-title">Notifications</h2>
          
          {/* --- NEW: Header 3-Dot Menu --- */}
          <div className="popup-header-options">
            <button 
              onClick={() => setIsHeaderMenuOpen(prev => !prev)} 
              className="notification-options-btn" // Reuse item button style
              aria-label="Notification options"
            >
              &#8942; {/* Vertical dots */}
            </button>
            {isHeaderMenuOpen && (
              <div className="notification-dropdown-menu">
                <button onClick={(e) => {
                  e.stopPropagation();
                  navigate('/settings/notifications');
                  setIsHeaderMenuOpen(false);
                  onClose();
                }}>
                  Notification Settings
                </button>
                <button onClick={handleMarkAllReadClick}>
                  Mark all as read
                </button>
              </div>
            )}
          </div>
          {/* --- END: Header 3-Dot Menu --- */}

        </div>
        {/* --- END: Updated Header --- */}

        {/* --- UPDATED: Filter Bar (Mark all removed) --- */}
        <div className="popup-filter-bar">
          <div className="filter-btn-group">
            <button
              className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterClick('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${currentFilter === 'unread' ? 'active' : ''}`}
              onClick={() => handleFilterClick('unread')}
            >
              Unread
            </button>
         </div>
          {/* "Mark all as read" button removed from here */}
        </div>
        {/* --- END: Updated Filter Bar --- */}

        {/* Main content area for the list */}
        <div className="popup-content">
          {notifications.length === 0 ? (
            <div className="notification-message">
              {currentFilter === 'unread' ? "You're all caught up!" : "No notifications yet."}
            </div>
          ) : (
            <ul className="notification-list">
              {displayedNotifications.map(notification => (
                <li
                  key={notification.notificationId}
                  className={`notification-list-item ${!notification.isRead ? 'unread' : ''}`}
                 onClick={() => handleItemClick(notification)}
                  role="link"
                  tabIndex={0}
                >
                  <span className="notification-icon">{getNotificationIcon(notification.type)}</span>
                  <div className="notification-details">
                    <span className="notification-text">{renderNotificationText(notification)}</span>
                    <span className="notification-timestamp">{formatTimestamp(notification.createdAt)}</span>
                 </div>

                  {/* --- UPDATED: 3-Dot Menu Logic --- */}
                  <div className="notification-item-right">
                    <button
                      className="notification-options-btn"
                      onClick={(e) => toggleDropdown(e, notification.notificationId)}
                      aria-label="Notification options"
                    >
                      &#8942;
                   </button>
                    {activeDropdown === notification.notificationId && (
                      <div className="notification-dropdown-menu">
                        {/* --- Show "Mark as Unread" if it's already read --- */}
                        {notification.isRead ? (
                          <button onClick={(e) => handleMarkAsUnreadClick(e, notification.notificationId)}>
                            Mark as Unread
                         </button>
                        ) : (
                          <button onClick={(e) => handleMarkAsReadClick(e, notification.notificationId)}>
                       Mark as Read
                          </button>
                        )}
                        <button
                         className="delete"
                         onClick={(e) => handleDeleteClick(e, notification.notificationId)}
                        >
                          Delete this notification
                        </button>
                      </div>
                    )}
                   </div>
                  {/* --- END: 3-Dot Menu Logic --- */}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer: "Load more" button */}
        {hasMore && (
          <div className="popup-footer">
            <button onClick={handleLoadMore} className="load-more-btn">
             Load more
            </button>
       </div>
        )}
      </div>
    </>
  );
}
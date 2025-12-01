import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsUnread 
} from '../services/apiService'; 

// Import CSS
import '../static/NotificationsPopup.css';
import '../static/CategoriesSidebar.css'; 

// Controls how many notifications are loaded per page
const NOTIFICATIONS_PER_PAGE = 5;


// Skeleton Component
function NotificationItemSkeleton() {
  return (
    <li className="notification-skeleton-item">
      <div className="skeleton skeleton-icon"></div>
      <div className="skeleton-text-container">
        <div className="skeleton skeleton-line"></div>
        <div className="skeleton skeleton-line short"></div>
      </div>
    </li>
  );
}

// Renders a list of skeleton notification items
function NotificationsListSkeleton() {
  return (
    <ul className="notification-skeleton-list">
      <NotificationItemSkeleton />
      <NotificationItemSkeleton />
      <NotificationItemSkeleton />
      <NotificationItemSkeleton />
      <NotificationItemSkeleton />
    </ul>
  );
}

// Main Notifications Popup Component
export default function NotificationsPopup({
  isVisible, 
  onClose, 
  notifications, 
  onRefresh,
  currentFilter, 
  onFilterChange,
  onNotificationClick,
  isLoading
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


  // Called when clicking 'All' or 'Unread'
  const handleFilterClick = (filter) => {
    onFilterChange(filter); 
    setVisibleCount(NOTIFICATIONS_PER_PAGE); 
    setActiveDropdown(null);
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
    e.stopPropagation(); 
    setActiveDropdown(null); 
    try {
      await markNotificationAsRead(notificationId);
      onRefresh(); 
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Called from the item 3-dot menu
  const handleMarkAsUnreadClick = async (e, notificationId) => {
    e.stopPropagation();
    setActiveDropdown(null);
    try {
      await markNotificationAsUnread(notificationId);
      onRefresh(); 
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
      onRefresh();
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
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.notificationId);
        onRefresh();
      } catch (error) {
        console.error("Failed to mark as read on click:", error);
      }
    }

    // Trigger any additional click handling (e.g., navigation)
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    
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
        {/* Popup Header with 3-dot menu */}
        <div className="popup-header">
          <h2 className="popup-title">Notifications</h2>
          
          {/*Header 3-Dot Menu*/}
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

        </div>

        {/*Filter Bar (Mark all removed) */}
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
        </div>

        {/* Main content area for the list */}
        <div className="popup-content">
          {isLoading ? (
            <NotificationsListSkeleton />
          ) : notifications.length === 0 ? (
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

                  {/* 3-Dot Menu Logic*/}
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
                        {notification.isRead ? (
                          <button 
                            data-action="mark-unread" 
                            onClick={(e) => handleMarkAsUnreadClick(e, notification.notificationId)}
                          >
                            Mark as Unread
                         </button>
                        ) : (
                          <button 
                            data-action="mark-read"
                             onClick={(e) => handleMarkAsReadClick(e, notification.notificationId)}
                          >
                            Mark as Read
                         </button>
                        )}
                        <button
                          data-action="delete"
                          className="delete" 
                          onClick={(e) => handleDeleteClick(e, notification.notificationId)}
                        >
                          Delete
                        </button>
                     </div>
                    )}
                   </div>
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
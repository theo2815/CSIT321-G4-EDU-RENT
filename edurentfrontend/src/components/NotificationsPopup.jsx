// src/components/NotificationsPopup.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // If notifications link somewhere

// Import CSS
import '../static/NotificationsPopup.css';
import '../static/CategoriesSidebar.css'; // Reusing close button style

// --- Mock Data ---
const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'like', user: 'Jane Doe', item: 'Calculus Textbook', timestamp: '2h ago' },
  { id: 2, type: 'message', user: 'Mike Ross', item: 'Desk Lamp Rental', timestamp: '5h ago' },
  { id: 3, type: 'listing', user: 'System', item: 'Your listing "Mini Fridge" is expiring soon.', timestamp: '1d ago' },
  // Add more notifications to test scrolling and "Load More"
  // { id: 4, type: 'like', user: 'Alice', item: 'Bluetooth Headphones', timestamp: '2d ago' },
  // { id: 5, type: 'message', user: 'Bob', item: 'Question about Textbook', timestamp: '3d ago' },
];

const NOTIFICATIONS_PER_PAGE = 3; // How many to show initially/load more

export default function NotificationsPopup({ isVisible, onClose }) {
  const [visibleCount, setVisibleCount] = useState(NOTIFICATIONS_PER_PAGE);

  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + NOTIFICATIONS_PER_PAGE);
  };

  const displayedNotifications = MOCK_NOTIFICATIONS.slice(0, visibleCount);
  const hasMore = MOCK_NOTIFICATIONS.length > visibleCount;
  const showAllCaughtUp = !hasMore && MOCK_NOTIFICATIONS.length > 0 && MOCK_NOTIFICATIONS.length <= 3; // Show if 1-3 total items

  // Function to render notification text based on type
  const renderNotificationText = (notification) => {
    switch (notification.type) {
      case 'like':
        return <><strong>{notification.user}</strong> liked your listing: <strong>{notification.item}</strong></>;
      case 'message':
        return <><strong>{notification.user}</strong> sent you a message about <strong>{notification.item}</strong></>;
      case 'listing': // Example system notification
        return <>{notification.item}</>; // System message might not need strong tags
      default:
        return <>Unknown notification type.</>;
    }
  };

   // Function to get appropriate icon
   const getNotificationIcon = (type) => {
       switch (type) {
         case 'like': return '❤️';
         case 'message': return '💬';
         case 'listing': return '📢'; // Example for system/listing updates
         default: return '🔔';
       }
   };

  return (
    <>
      {/* Overlay */}
      {isVisible && <div className="notifications-popup-overlay" onClick={onClose}></div>}

      {/* Popup */}
      <div
        className={`notifications-popup ${isVisible ? 'visible' : ''}`}
        aria-label="Notifications pop-up"
        aria-hidden={!isVisible}
        role="dialog" // More appropriate role
      >
        {/* Header */}
        <div className="popup-header">
          <h2 className="popup-title">Notifications</h2>
          <button onClick={onClose} className="sidebar-close-btn" aria-label="Close notifications">
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="popup-content">
          {MOCK_NOTIFICATIONS.length === 0 ? (
            <div className="notification-message">No notifications yet.</div>
          ) : (
            <ul className="notification-list">
              {displayedNotifications.map(notification => (
                <li key={notification.id} className="notification-list-item">
                  <span className="notification-icon">{getNotificationIcon(notification.type)}</span>
                  <div className="notification-details">
                    <span className="notification-text">{renderNotificationText(notification)}</span>
                    <span className="notification-timestamp">{notification.timestamp}</span>
                  </div>
                </li>
              ))}
              {/* Show "That's all" message if few items and no more to load */}
              {showAllCaughtUp && (
                  <div className="notification-message">That’s all for now.</div>
              )}
            </ul>
          )}
        </div>

        {/* Footer */}
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
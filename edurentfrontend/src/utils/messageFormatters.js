/**
 * Message formatting utilities for date/time display in chat interfaces.
 * Extracted from MessagesPage.jsx for reusability and maintainability.
 */

/**
 * Formats a date as a relative time string (e.g., "Just now", "5 mins ago", "2 days ago")
 * @param {string|Date} dateString - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
};

/**
 * Formats a date for display in chat messages (e.g., "10:30 AM", "Mon 10:30 AM", "Dec 25, 2024, 10:30 AM")
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted timestamp string
 */
export const formatChatTimestamp = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
  const timeOptions = { hour: 'numeric', minute: '2-digit' };

  if (isToday) return date.toLocaleTimeString([], timeOptions);
  const diffInHours = (now - date) / 1000 / 60 / 60;
  if (diffInHours < 24 * 6) {
    return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
           date.toLocaleTimeString([], timeOptions);
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + 
         ', ' + date.toLocaleTimeString([], timeOptions);
};

/**
 * Returns a date label for message grouping (e.g., "Today", "Yesterday", "Dec 25, 2024")
 * @param {string|Date} dateString - The date to get label for
 * @returns {string|null} Date label or null if no date
 */
export const getDateLabel = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const y = new Date(n);
  y.setDate(n.getDate() - 1);
  
  if (d.getTime() === n.getTime()) return 'Today';
  if (d.getTime() === y.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Checks if two dates are on the same calendar day
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {boolean} True if same day
 */
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getDate() === d2.getDate() && 
         d1.getMonth() === d2.getMonth() && 
         d1.getFullYear() === d2.getFullYear();
};

import React from 'react';
import { Link } from 'react-router-dom';
import '../static/Dropdown.css';
import defaultAvatar from '../assets/default-avatar.png'; // Assuming this import path is correct relative to components

export default function UserDropdown({ userName, profilePictureUrl, onLogout }) {
  
  // Helper to format the avatar URL
  const getAvatarUrl = (url) => {
    if (!url) return defaultAvatar;
    return url.startsWith('http') ? url : `${import.meta.env.VITE_BACKEND_URL}${url}`;
  };

  return (
    <div className="select-container">
      <div className="selected-header">
        <img 
            src={getAvatarUrl(profilePictureUrl)} 
            alt="Profile" 
            className="user-avatar-small"
             onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
        />
        <span className="user-name-span">
            {userName ? `Hello, ${userName}` : 'User'}
        </span>
        
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1em"
          viewBox="0 0 512 512"
          className="arrow-icon"
        >
          <path
            d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
          ></path>
        </svg>
      </div>
      
      <div className="options-list">
        <Link to="/profile" className="option-item">
            My Profile
        </Link>
        <Link to="/settings" className="option-item">
            Settings
        </Link>
        <button className="option-item" onClick={onLogout}>
            Logout
        </button>
      </div>
    </div>
  );
}

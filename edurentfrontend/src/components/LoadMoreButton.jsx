import React from 'react';
import './LoadMoreButton.css';

export default function LoadMoreButton({ onLoadMore, isLoading, hasMore }) {
  if (!hasMore) return null;

  const handleClick = (e) => {
    e.preventDefault();
    if (!isLoading) {
      onLoadMore();
    }
  };

  return (
    <div className="load-more-container">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`load-more-btn ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? (
          <>
            <span className="load-more-spinner"></span>
            <span>Loading...</span>
          </>
        ) : (
          <>
            <span className="load-more-icon">↓</span>
            <span>Load More</span>
          </>
        )}
      </button>
    </div>
  );
}
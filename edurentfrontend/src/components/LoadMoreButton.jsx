import React from 'react';

export default function LoadMoreButton({ onLoadMore, isLoading, hasMore }) {
  if (!hasMore) return null;

  const handleClick = (e) => {
    e.preventDefault();
    onLoadMore();      
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="btn btn-outline"
        style={{
          padding: '0.75rem 2rem',
          minWidth: '200px',
          cursor: isLoading ? 'wait' : 'pointer'
        }}
      >
        {isLoading ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
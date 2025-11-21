import React from 'react';

// --- FIX: Use a Data URI for the placeholder to prevent network errors ---
const defaultPlaceholder = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3e%3crect width='200' height='200' fill='%23f0f0f0'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23aaaaaa'%3eNo Image%3c/text%3e%3c/svg%3e";

export default function ListingCard({ 
  listing, 
  onClick, 
  isLiked, 
  onLikeClick, 
  currentUserId, 
  isLiking,
  variant = 'standard' // 'standard' | 'compact'
}) { 
  
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(listing);
    }
  };
  
  const handleLikeClick = (e) => {
    e.stopPropagation(); 
    if (onLikeClick) {
      onLikeClick(listing.listingId);
    }
  };

  // --- Data Extraction ---
  const categoryName = listing?.category?.name || "Category";
  const listingType = listing?.listingType || "For Sale";
  const title = listing?.title || "No title";
  const description = listing?.description || "";
  const price = listing?.price || 0;

  // --- FIX: Improved Image Logic ---
  // 1. Check for single 'image' string (Used in MessagesPage DTO)
  // 2. Check for 'listingImages' array (Used in standard Entity)
  // 3. Check for 'images' array (Legacy)
  let coverImageUrl = listing?.image || null;

  if (!coverImageUrl) {
      const rawImages = listing?.listingImages || listing?.images || [];
      if (rawImages.length > 0) {
          // Find cover photo or use the first one
          const coverObj = rawImages.find(img => img.coverPhoto) || rawImages[0];
          coverImageUrl = coverObj ? coverObj.imageUrl : null;
      }
  }
  // --------------------------------

  const displayIcon = listing?.icon || '📦';
  
  const isRent = listingType.toUpperCase().includes('RENT');
  const typeClassName = isRent ? 'rent' : 'sale';
  const typeText = isRent ? 'For Rent' : 'For Sale';
  const isOwner = currentUserId === listing?.user?.userId || currentUserId === listing?.ownerId;

  // Helper to format image URL
  const getFullImageUrl = (path) => {
      if (!path) return null;
      return path.startsWith('http') ? path : `http://localhost:8080${path}`;
  };

  return (
    <div 
      className={`listing-card ${variant === 'compact' ? 'compact' : ''}`} 
      onClick={handleClick} 
      role="button" 
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e)}
    >

      <div className="listing-image">
        {!isOwner && (
          <button
            className={`like-button ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeClick}
            disabled={isLiking}
            aria-label={isLiked ? 'Unlike item' : 'Like item'}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            {isLiking ? '...' : (isLiked ? '❤️' : '🤍')}
          </button>
        )}

        {coverImageUrl ? (
          <img 
            src={getFullImageUrl(coverImageUrl)} 
            alt={title} 
            // --- FIX: Use local Data URI fallback ---
            onError={(e) => { 
                e.target.onerror = null; 
                e.target.src = defaultPlaceholder; 
            }} 
            // ----------------------------------------
          />
        ) : (
          <span className="fallback-icon" style={{ fontSize: variant === 'compact' ? '1.5rem' : '3rem', color: 'var(--text-muted)' }}>
            {displayIcon}
          </span>
        )}
      </div>

      <div className="listing-content">
        {variant !== 'compact' && <div className="listing-category">{categoryName}</div>}
        
        <h3 className="listing-title">{title}</h3>
        
        {variant !== 'compact' && (
           <p className="listing-description">{description.substring(0, 100)}{description.length > 100 ? '...' : ''}</p>
        )}

        <div className="listing-footer">
          <div className="listing-price">₱{price.toFixed(2)}</div>
          
          {variant !== 'compact' && (
            <span className={`listing-type ${typeClassName}`}>
              {typeText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
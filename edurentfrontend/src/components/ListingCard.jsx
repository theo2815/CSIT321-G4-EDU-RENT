import React, { useMemo } from 'react';

// Use a Data URI for the placeholder to prevent network errors/broken images
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
  
  // --- Event Handlers ---
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

  // --- Data Extraction & Formatting ---
  const categoryName = listing?.category?.name || "Category";
  const listingType = listing?.listingType || "For Sale";
  const title = listing?.title || "No title";
  const description = listing?.description || "";
  const price = listing?.price || 0;
  
  // Logic to determine if the item is sold
  const isSold = listing?.status === 'Sold';

  // Calculate the number of likes based on the likes array
  const serverLikeCount = listing?.likes ? listing.likes.length : 0;

  // Check if the server thinks we liked it (Stale state)
  const wasLikedInitial = useMemo(() => {
    if (!listing?.likes || !currentUserId) return false;
    return listing.likes.some(like => like.id?.userId === currentUserId);
  }, [listing?.likes, currentUserId]);

  // Adjust count based on current optimistic state (Live state)
  let displayLikeCount = serverLikeCount;
  if (isLiked && !wasLikedInitial) {
    displayLikeCount++; 
  } else if (!isLiked && wasLikedInitial) {
    displayLikeCount--;
  }
  // Safety floor
  displayLikeCount = Math.max(0, displayLikeCount);

  // --- Image Handling Logic ---
  // 1. Check for a direct image URL string.
  // 2. If not found, look through the image arrays (listingImages or images).
  // 3. Prioritize the cover photo, otherwise default to the first image found.
  let coverImageUrl = listing?.image || null;

  if (!coverImageUrl) {
      const rawImages = listing?.listingImages || listing?.images || [];
      if (rawImages.length > 0) {
          const coverObj = rawImages.find(img => img.coverPhoto) || rawImages[0];
          coverImageUrl = coverObj ? coverObj.imageUrl : null;
      }
  }

  const displayIcon = listing?.icon || '📦';
  const isRent = listingType.toUpperCase().includes('RENT');
  const typeClassName = isRent ? 'rent' : 'sale';
  const typeText = isRent ? 'For Rent' : 'For Sale';
  
  // Determine if the current user owns this listing to disable self-liking
  const isOwner = currentUserId === listing?.user?.userId || currentUserId === listing?.ownerId;

  // Helper to ensure image URLs are absolute (handles localhost vs production paths)
  const getFullImageUrl = (path) => {
      if (!path) return null;
      return path.startsWith('http') ? path : `http://localhost:8080${path}`;
  };

  return (
    <div 
      // Apply conditional classes for compact view and sold status (grayscale effect)
      className={`listing-card ${variant === 'compact' ? 'compact' : ''} ${isSold ? 'sold-item' : ''}`} 
      onClick={handleClick} 
      role="button" 
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e)}
    >

      <div className="listing-image">
        
        {/* --- Sold Status Badge --- */}
        {isSold && (
          <div className="sold-badge-overlay">
            <span>SOLD</span>
          </div>
        )}

        {/* --- Like Badge with Count --- */}
        {variant !== 'compact' && (
        <div 
            className="like-badge"
            onClick={!isOwner ? handleLikeClick : undefined}
            title={isOwner ? `${displayLikeCount} likes` : (isLiked ? 'Unlike' : 'Like')}
            style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '4px 8px',
                borderRadius: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: !isOwner ? 'pointer' : 'default',
                transition: 'transform 0.2s',
                border: '1px solid rgba(0,0,0,0.05)'
            }}
            // Add subtle hover animation for non-owners
            onMouseEnter={(e) => !isOwner && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => !isOwner && (e.currentTarget.style.transform = 'scale(1)')}
        >
            <span style={{ fontSize: '1rem', lineHeight: 1, color: isOwner ? '#6c757d' : (isLiked ? '#e53935' : '#ccc') }}>
                {isLiking ? '...' : (isOwner ? '🖤' : (isLiked ? '❤️' : '🤍'))}
            </span>
            {variant !== 'compact' && (
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#333' }}>
                    {displayLikeCount}
                </span>
            )}
        </div>
      )}
        {/* --- Main Image or Fallback --- */}
        {coverImageUrl ? (
          <img 
            src={getFullImageUrl(coverImageUrl)} 
            alt={title} 
            onError={(e) => { 
                e.target.onerror = null; 
                e.target.src = defaultPlaceholder; 
            }} 
          />
        ) : (
          <span className="fallback-icon" style={{ fontSize: variant === 'compact' ? '1.5rem' : '3rem', color: 'var(--text-muted)' }}>
            {displayIcon}
          </span>
        )}
      </div>

      {/* --- Card Content --- */}
      <div className="listing-content">
        {variant !== 'compact' && <div className="listing-category">{categoryName}</div>}
        
        <h3 className="listing-title">{title}</h3>
        
        {variant !== 'compact' && (
          <p className="listing-description">
            {description.substring(0, 100)}{description.length > 100 ? '...' : ''}
          </p>
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
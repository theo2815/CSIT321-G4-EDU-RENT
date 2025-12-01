// This component displays a single listing card with image, title, price, and like functionality
import React, { useMemo } from 'react';

// Use a built-in base64 image as a backup so we don't have broken image icons
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
  
  // Navigate to the listing unless a specific handler prevents it
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(listing);
    }
  };
  
  // Prevent the main card click from firing when the user clicks the "Like" heart
  const handleLikeClick = (e) => {
    e.stopPropagation(); 
    if (onLikeClick) {
      onLikeClick(listing.listingId);
    }
  };

  // Pull out the data we need to display, using safe defaults if something is missing
  const categoryName = listing?.category?.name || "Category";
  const listingType = listing?.listingType || "For Sale";
  const title = listing?.title || "No title";
  const description = listing?.description || "";
  const price = listing?.price || 0;
  
  // Check if the item is already sold
  const isSold = listing?.status === 'Sold';

  // Count the likes currently stored in the listing data
  const serverLikeCount = listing?.likes ? listing.likes.length : 0;

  // Check if the user had already liked this item when the data first loaded
  const wasLikedInitial = useMemo(() => {
    if (!listing?.likes || !currentUserId) return false;
    return listing.likes.some(like => like.id?.userId === currentUserId);
  }, [listing?.likes, currentUserId]);

  // Update the like count immediately for the UI (optimistic update)
  let displayLikeCount = serverLikeCount;
  if (!isSold) {
    if (isLiked && !wasLikedInitial) {
      displayLikeCount++; 
    } else if (!isLiked && wasLikedInitial) {
      displayLikeCount--;
    }
  }
  // Ensure we never show a negative number
  displayLikeCount = Math.max(0, displayLikeCount);

  // Figure out which image to show
  // 1. Try the direct image string.
  // 2. If missing, look for an array of images.
  // 3. Prefer the one marked as 'coverPhoto', or just take the first one.
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
  
  // Disable liking if the current user is the owner
  const isOwner = currentUserId === listing?.user?.userId || currentUserId === listing?.ownerId;

  // Fix image paths to ensure they work on both localhost and production
  const getFullImageUrl = (path) => {
      if (!path) return null;
      return path.startsWith('http') ? path : `http://localhost:8080${path}`;
  };

  return (
    <div 
      // Add classes for styling based on if it's compact or sold
      className={`listing-card ${variant === 'compact' ? 'compact' : ''} ${isSold ? 'sold-item' : ''}`} 
      onClick={handleClick} 
      role="button" 
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e)}
    >

      <div className="listing-image">
        
        {/* Overlay badge if the item is sold */}
        {isSold && (
          <div className="sold-badge-overlay">
            <span>SOLD</span>
          </div>
        )}

        {/* Like button (Heart) with count */}
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
            // Simple hover effect for non-owners
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
        {/* Show the actual image, or the icon if no image exists */}
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

      {/* Listing details text */}
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
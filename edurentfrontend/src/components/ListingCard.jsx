import React, { useMemo } from 'react';
// Import the auth modal hook so we can prompt guests to log in
import { useAuthModal } from '../context/AuthModalContext';

// Use a built-in base64 image as a backup to prevent broken icons
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
  
  // Get the login modal trigger
  const { openLogin } = useAuthModal();

  // Handle card clicks to navigate to details
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(listing);
    }
  };
  
  // Handle the like button click safely
  const handleLikeClick = (e) => {
    e.stopPropagation(); // Don't trigger the card navigation
    
    // If the user isn't logged in, prompt them to sign in first
    if (!currentUserId) {
        openLogin();
        return;
    }

    // Otherwise, proceed with the like action
    if (onLikeClick) {
      onLikeClick(listing.listingId);
    }
  };

  // Extract listing details safely with fallback values
  const categoryName = listing?.category?.name || "Category";
  const listingType = listing?.listingType || "For Sale";
  const title = listing?.title || "No title";
  const description = listing?.description || "";
  const price = listing?.price || 0;
  
  const isSold = listing?.status === 'Sold';
  const serverLikeCount = listing?.likes ? listing.likes.length : 0;

  // Check if the user liked this in the initial data load
  const wasLikedInitial = useMemo(() => {
    if (!listing?.likes || !currentUserId) return false;
    return listing.likes.some(like => like.id?.userId === currentUserId);
  }, [listing?.likes, currentUserId]);

  // Calculate the display count for immediate UI feedback (optimistic update)
  let displayLikeCount = serverLikeCount;
  if (!isSold) {
    if (isLiked && !wasLikedInitial) {
      displayLikeCount++; 
    } else if (!isLiked && wasLikedInitial) {
      displayLikeCount--;
    }
  }
  displayLikeCount = Math.max(0, displayLikeCount);

  // Determine the best image to display
  let coverImageUrl = listing?.image || null;

  if (!coverImageUrl) {
      const rawImages = listing?.listingImages || listing?.images || [];
      if (rawImages.length > 0) {
          // Try to find the cover photo, otherwise grab the first one
          const coverObj = rawImages.find(img => img.coverPhoto) || rawImages[0];
          coverImageUrl = coverObj ? coverObj.imageUrl : null;
      }
  }

  const displayIcon = listing?.icon || '📦';
  const isRent = listingType.toUpperCase().includes('RENT');
  const typeClassName = isRent ? 'rent' : 'sale';
  const typeText = isRent ? 'For Rent' : 'For Sale';
  
  // Check if the current viewer owns this item
  const isOwner = !!currentUserId && (currentUserId === listing?.user?.userId || currentUserId === listing?.ownerId);

  // Ensure image URLs are complete
  const getFullImageUrl = (path) => {
      if (!path) return null;
      return path.startsWith('http') ? path : `http://localhost:8080${path}`;
  };

  return (
    <div 
      className={`listing-card ${variant === 'compact' ? 'compact' : ''} ${isSold ? 'sold-item' : ''}`} 
      onClick={handleClick} 
      role="button" 
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e)}
    >

      <div className="listing-image">
        
        {isSold && (
          <div className="sold-badge-overlay">
            <span>SOLD</span>
          </div>
        )}

        {/* Like Badge */}
        {variant !== 'compact' && (
        <div 
            className="like-badge"
            onClick={!isOwner ? handleLikeClick : undefined}
            // Update tooltip: Owner gets count, Guest gets Login prompt, User gets Like/Unlike
            title={isOwner ? `${displayLikeCount} likes` : (!currentUserId ? 'Login to like' : (isLiked ? 'Unlike' : 'Like'))}
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
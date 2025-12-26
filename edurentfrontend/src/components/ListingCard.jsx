import React, { useMemo } from 'react';
import { useAuthModal } from '../hooks/useAuthModal';

const defaultPlaceholder = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3e%3crect width='200' height='200' fill='%23f0f0f0'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23aaaaaa'%3eNo Image%3c/text%3e%3c/svg%3e";

export default function ListingCard({ 
  listing, 
  onClick, 
  isLiked, 
  onLikeClick, 
  currentUserId, 
  isLiking,
  variant = 'standard'
}) { 
  
  const { openLogin } = useAuthModal();

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(listing);
    }
  };
  
  const handleLikeClick = (e) => {
    e.stopPropagation(); 
    if (!currentUserId) {
        openLogin();
        return;
    }
    if (onLikeClick) {
      onLikeClick(listing.listingId);
    }
  };

  const categoryName = listing?.category?.name || "Category";
  const listingType = listing?.listingType || "For Sale";
  const title = listing?.title || "No title";
  const description = listing?.description || "";
  const price = listing?.price || 0;
  
  // Status Checks
  const isSold = listing?.status === 'Sold';
  const isRented = listing?.status === 'Rented';
  
  // Find active rental info from either single object or array
  const rentalInfo = listing?.transaction || (listing?.transactions?.find(t => 
    t.status === 'Active' || (new Date(t.endDate) > new Date())
  ));

  const serverLikeCount = listing?.likes ? listing.likes.length : 0;

  const wasLikedInitial = useMemo(() => {
    if (!listing?.likes || !currentUserId) return false;
    return listing.likes.some(like => like.id?.userId === currentUserId);
  }, [listing?.likes, currentUserId]);

  // Optimistic UI update for likes (disabled if item is sold)
  let displayLikeCount = serverLikeCount;
  if (!isSold) {
    if (isLiked && !wasLikedInitial) {
      displayLikeCount++; 
    } else if (!isLiked && wasLikedInitial) {
      displayLikeCount--;
    }
  }
  displayLikeCount = Math.max(0, displayLikeCount);

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
  
  const isOwner = !!currentUserId && (currentUserId === listing?.user?.userId || currentUserId === listing?.ownerId);

  const getFullImageUrl = (path) => {
      if (!path) return null;
      return path.startsWith('http') ? path : `http://localhost:8080${path}`;
  };

  const formatDate = (dateString) => {
     if (!dateString) return '';
     // Parse string directly to avoid timezone shifts (Treat as UTC)
     const date = new Date(dateString);
     return date.toLocaleDateString('en-US', { 
       month: '2-digit', 
       day: '2-digit', 
       year: 'numeric',
       timeZone: 'UTC' 
     });
  };

  return (
    <div 
      className={`listing-card ${variant === 'compact' ? 'compact' : ''} ${(isSold || isRented) ? 'sold-item' : ''}`} 
      onClick={handleClick}
      role="button" 
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e)}
    >

      <div className="listing-image">
        
        {/* Status Overlay for Sold or Rented */}
        {(isSold || isRented) && (
          <div className="sold-badge-overlay">
            {isSold && <span>SOLD</span>}
            
            {isRented && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'rotate(-15deg)' }}>
                    <span style={{ transform: 'none', marginBottom: '4px', borderColor: '#2ecc71', backgroundColor: '#2ecc71' }}>
                        RENTED
                    </span>
                    {rentalInfo && rentalInfo.startDate && rentalInfo.endDate && (
                        <div style={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.85)', 
                            color: '#fff', 
                            padding: '4px 8px', 
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            textAlign: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                            <div>Start: {formatDate(rentalInfo.startDate)}</div>
                            <div>End: {formatDate(rentalInfo.endDate)}</div>
                        </div>
                    )}
                </div>
            )}
          </div>
        )}

        {variant !== 'compact' && (
        <div 
            className="like-badge"
            // Allow liking even if rented (only disable if owner)
            onClick={(!isOwner && !isSold) ? handleLikeClick : undefined}
            title={isOwner ? `${displayLikeCount} likes` : (!currentUserId ? 'Login to like' : (isSold ? 'Item is sold' : (isLiked ? 'Unlike' : 'Like')))}
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
                cursor: (!isOwner && !isSold) ? 'pointer' : 'default',
                transition: 'transform 0.2s',
                border: '1px solid rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => (!isOwner && !isSold) && (e.currentTarget.style.transform = 'scale(1.05)')}
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
            loading="lazy"
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
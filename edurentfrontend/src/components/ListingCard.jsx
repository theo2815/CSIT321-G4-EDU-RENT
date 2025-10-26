// src/components/ListingCard.jsx
import React from 'react';

export default function ListingCard({ listing, onClick }) {
  const handleClick = (e) => {
      if (onClick) {
          e.preventDefault();
          onClick(listing);
      }
  };

  // --- Extract data with fallbacks, using backend names ---
  const categoryName = listing?.category?.name || "Category"; // Optional chaining
  const listingType = listing?.listingType || "For Sale"; // Backend field name
  const title = listing?.title || "No title";
  const description = listing?.description || "No description available.";
  const price = listing?.price || 0;

  // --- Determine Cover Image ---
  // Find the image marked as cover, or take the first one, or use placeholder icon
  const coverImage = listing?.images?.find(img => img.coverPhoto)?.imageUrl || // Find cover image URL
                     listing?.images?.[0]?.imageUrl || // Fallback to first image URL
                     null; // No image URL found
  const displayIcon = listing?.icon || '📦'; // Keep icon as ultimate fallback

  // --- Determine Type Class and Text ---
  const isRent = listingType.toUpperCase().includes('RENT');
  const typeClassName = isRent ? 'rent' : 'sale';
  const typeText = isRent ? 'For Rent' : 'For Sale';

  return (
    <div className="listing-card" onClick={handleClick} role="button" tabIndex={0}
         onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e)}>

      <div className="listing-image">
        {/* --- Display fetched image or fallback icon --- */}
        {coverImage ? (
           // Assuming imageUrl is relative path; adjust prefix if needed (e.g., if storing full URLs)
          <img src={`http://localhost:8080${coverImage}`} alt={title} onError={(e) => e.target.style.display = 'none'} /> // Basic error handling
        ) : (
          <span style={{ fontSize: '3rem', color: 'var(--text-muted)' }}>{displayIcon}</span> // Show icon if no image URL
        )}
      </div>

      <div className="listing-content">
        <div className="listing-category">{categoryName}</div>
        <h3 className="listing-title">{title}</h3>
        {/* Shorten description for card if needed */}
        <p className="listing-description">{description.substring(0, 100)}{description.length > 100 ? '...' : ''}</p>
        <div className="listing-footer">
          <div className="listing-price">₱{price.toFixed(2)}</div>
          <span className={`listing-type ${typeClassName}`}>
            {typeText} {/* Use variable for text */}
          </span>
        </div>
      </div>
    </div>
  );
}
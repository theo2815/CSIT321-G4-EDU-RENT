// src/components/ListingCard.jsx
import React from 'react';
// Import CSS if specific styles moved here

export default function ListingCard({ listing, onClick }) { // <-- Add onClick prop
  // Function to handle the click and prevent default link behavior if wrapped in Link
  const handleClick = (e) => {
      if (onClick) {
          e.preventDefault(); // Prevent navigation if wrapped in Link for styling
          onClick(listing); // Pass the listing data up
      }
      // If not wrapped in Link or no onClick, it behaves normally
  };

  // Render the card, wrapping it or adding onClick directly
  return (
    // Add onClick directly to the div
    <div className="listing-card" onClick={handleClick} role="button" tabIndex={0} // Make it keyboard accessible
         onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e)}>
      <div className="listing-image">
        {/* ... image/icon ... */}
         {listing.image ? <img src={listing.image} alt={listing.title} /> : <span>{listing.icon || '📦'}</span>}
      </div>
      <div className="listing-content">
        {/* ... category, title, description ... */}
        <div className="listing-category">{listing.category}</div>
         <h3 className="listing-title">{listing.title}</h3>
         <p className="listing-description">{listing.description}</p>
        <div className="listing-footer">
          {/* ... price, type ... */}
          <div className="listing-price">₱{listing.price?.toFixed(2)}</div>
           <span className={`listing-type ${listing.type}`}>
             {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
           </span>
        </div>
      </div>
    </div>
  );
}
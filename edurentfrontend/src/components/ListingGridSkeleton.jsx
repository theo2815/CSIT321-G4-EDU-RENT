// src/components/ListingGridSkeleton.jsx
import React from 'react';
// Import skeleton CSS if it's in a separate file
// import '../static/Skeleton.css';

// Reusable component for a single skeleton listing card
function SkeletonListingCard() {
  return (
    <div className="skeleton-listing-card">
      <div className="skeleton skeleton-listing-image"></div>
      <div className="skeleton-listing-content">
        <div className="skeleton skeleton-listing-text" style={{ width: '40%', marginBottom: '1rem' }}></div> {/* Category */}
        <div className="skeleton skeleton-listing-text" style={{ width: '80%' }}></div> {/* Title line 1 */}
        <div className="skeleton skeleton-listing-text" style={{ width: '60%', marginBottom: '1rem' }}></div> {/* Title line 2 */}
        <div className="skeleton skeleton-listing-text" style={{ width: '90%' }}></div> {/* Description line 1 */}
        <div className="skeleton skeleton-listing-text" style={{ width: '70%', marginTop: '1.5rem', height: '1.5rem' }}></div> {/* Price */}
      </div>
    </div>
  );
}

// Component that renders multiple skeleton cards in a grid
// Takes 'count' prop for how many cards to show
export default function ListingGridSkeleton({ count = 6 }) { // Default to showing 6 cards
  return (
    <div className="skeleton-listing-grid">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonListingCard key={index} />
      ))}
    </div>
  );
}
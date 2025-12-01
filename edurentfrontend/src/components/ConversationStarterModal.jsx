// This compotent is used in profile page to select a listing to start conversation about
import React, { useState } from 'react';
import ListingCard from './ListingCard';
import useSearch from '../hooks/useSearch';
import useFilteredListings from '../hooks/useFilteredListings';
import '../static/ConversationStarterModal.css';

export default function ConversationStarterModal({ 
  isOpen, 
  onClose, 
  listings, 
  onListingSelect,
  currentUserId,
  likedListingIds,
  likingInProgress,
  onLikeToggle
}) {
  // Controls which filter tab is currently active
  const [filterType, setFilterType] = useState('all'); 

  // Filter the raw listing data based on the user's search input
  const { searchQuery, handleSearch, filteredListings: searchedListings } = useSearch(
    listings,
    ['title', 'description', 'category.name']
  );

  // Apply the specific type filter (Rent/Sale) to the search results
  const finalDisplayListings = useFilteredListings(searchedListings, filterType);

  if (!isOpen) return null;

  return (
    <div className="starter-modal-overlay">
      <div className="starter-modal-content">
        {/* Modal header containing the title and close action */}
        <div className="starter-modal-header">
          <h3 className="starter-modal-title">Select a product to start chatting</h3>
          <button className="starter-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Search bar and filter tabs for refining the list */}
        <div className="starter-controls">
          <div className="starter-filter-tabs">
            <button 
              className={`starter-tab ${filterType === 'all' ? 'active' : ''}`} 
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button 
              className={`starter-tab ${filterType === 'sale' ? 'active' : ''}`} 
              onClick={() => setFilterType('sale')}
            >
              For Sale
            </button>
            <button 
              className={`starter-tab ${filterType === 'rent' ? 'active' : ''}`} 
              onClick={() => setFilterType('rent')}
            >
              For Rent
            </button>
          </div>

          <div className="starter-search-wrapper">
            <input 
              type="text" 
              placeholder="Search this seller's items..." 
              value={searchQuery}
              onChange={handleSearch}
              className="starter-search-input"
            />
          </div>
        </div>

        {/* Grid display for the filtered listings */}
        <div className="starter-listings-grid">
          {finalDisplayListings.length > 0 ? (
            finalDisplayListings.map(listing => (
              // Wrap the ListingCard to ensure it fits the grid layout
              <div key={listing.listingId} className="starter-card-wrapper">
                <ListingCard 
                  listing={listing}
                  onClick={onListingSelect} 
                  isLiked={likedListingIds.has(listing.listingId)} 
                  onLikeClick={onLikeToggle} 
                  isLiking={likingInProgress.has(listing.listingId)} 
                  currentUserId={currentUserId}
                />
              </div>
            ))
          ) : (
            <div className="starter-empty-state">
              <p>No listings found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
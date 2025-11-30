// edurentfrontend/src/components/ConversationStarterModal.jsx
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
  const [filterType, setFilterType] = useState('all'); // 'all', 'rent', 'sale'

  // 1. Search Hook: Filter the raw list by search query
  const { searchQuery, handleSearch, filteredListings: searchedListings } = useSearch(
    listings,
    ['title', 'description', 'category.name']
  );

  // 2. Filter Hook: Filter the searched list by Type (Rent/Sale)
  const finalDisplayListings = useFilteredListings(searchedListings, filterType);

  if (!isOpen) return null;

  return (
    <div className="starter-modal-overlay">
      <div className="starter-modal-content">
        {/* Header */}
        <div className="starter-modal-header">
          <h3 className="starter-modal-title">Select a product to start chatting</h3>
          <button className="starter-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Controls: Filter Tabs & Search */}
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

        {/* Listing Grid */}
        <div className="starter-listings-grid">
          {finalDisplayListings.length > 0 ? (
            finalDisplayListings.map(listing => (
              // Reusing ListingCard with a "compact" variant if you have it, 
              // otherwise the standard card works but might need CSS tweaking in the grid
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
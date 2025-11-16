import React from 'react'; // No more useState, useEffect, useCallback
import { Link, useNavigate } from 'react-router-dom';

// --- Import All Hooks ---
import useAuth from '../hooks/useAuth';
import usePageData from '../hooks/usePageData';
import useSearch from '../hooks/useSearch';
import usePageLogic from '../hooks/usePageLogic';
import useFilteredListings from '../hooks/useFilteredListings'; // New hook for filtering
import useLikes from '../hooks/useLikes';

// --- Import Components ---
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
// ProductDetailModal and Skeleton are now handled internally by usePageLogic

// --- Import CSS ---
import '../static/BrowsePage.css';
import '../static/DashboardPage.css'; // For shared grid and card styles

// --- SVG Icon Component ---
const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  ),
};

// --- Main Page Component ---
export default function BrowsePage() {
  const navigate = useNavigate();

  // 1. Authentication Hook: Manages user data, login status, and auth errors.
  const { userData, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();

  // 2. Page Data Hook: Fetches all listings and categories once the user is authenticated.
  const { allListings, categories, isLoadingData, dataError, refetchData } = usePageData(!!userData);

  // 3. Search Hook: Manages search query state and filters the 'allListings' list.
  const { searchQuery, handleSearch, filteredListings } = useSearch(
    allListings,
    ['title', 'description', 'category.name'] // Keys to search
  );
  
  // 4. Likes Hook: Manages all like-related state and logic.
  const likesHook = useLikes();
  const { 
    likedListingIds, 
    likingInProgress, 
    isLoadingLikes, 
    likeError, 
    handleLikeToggle,
    refetchLikes
  } = likesHook;

  // 5. Page Logic Hook: Manages modals and notifications.
  // It receives 'likesHook' to pass all like data to the modal.
  const { 
    openModal,
    handleNotificationClick, 
    ModalComponent
  } = usePageLogic(userData, likesHook); // <-- Pass the whole likesHook in

  // 6. Filtering Hooks: Takes the searched list and creates type-specific lists.
  const saleListings = useFilteredListings(filteredListings, 'sale');
  const rentListings = useFilteredListings(filteredListings, 'rent');

  // --- All component state (useState) and logic functions are now in the hooks ---

  // Combines loading states from all relevant hooks.
  const isPageLoading = isLoadingAuth || isLoadingData || isLoadingLikes;
  
  // Combines error states from all relevant hooks.
  const pageError = authError || dataError || likeError;

  // Retries fetching data for any hook that failed.
  const handleRetry = () => {
    if (authError) retryAuth();
    if (dataError) refetchData();
    if (likeError) refetchLikes();
    // Fallback
    if (!authError && !dataError && !likeError) {
      retryAuth();
      refetchData();
      refetchLikes();
    }
  };

  // --- Loading State ---
  // (Using the skeleton layout from your original 'isLoading' block)
  if (isPageLoading) {
    return (
        <div className="profile-page">
            <Header userName="" onLogout={logout} searchQuery="" onSearchChange={()=>{}} />
            <main className="browse-page-container">
                <div className="browse-search-bar skeleton" style={{ height: '60px', marginBottom: '2rem' }}></div>
                <section className="browse-section">
                    <div className="skeleton skeleton-listing-text" style={{ height: '2.5rem', width: '200px', marginBottom: '1.5rem' }}></div>
                    <ListingGridSkeleton count={4} />
                </section>
                <section className="browse-section">
                    <div className="skeleton skeleton-listing-text" style={{ height: '2.5rem', width: '200px', marginBottom: '1.5rem' }}></div>
                    <ListingGridSkeleton count={4} />
                </section>
            </main>
        </div>
    );
  }

  // --- Error State ---
  // (Using the error layout from your original 'error' block and adding a retry button)
  if (pageError) {
       return (
         <div className="profile-page">
             <Header userName={userName} onLogout={logout} searchQuery="" onSearchChange={()=>{}} />
             <div style={{ padding: '2rem', textAlign: 'center' }}>
               <div style={{color: 'red', marginBottom: '1rem'}}>Error: {pageError}</div>
               {/* This button will retry the specific part that failed */}
               <button className="error-retry-btn" onClick={handleRetry}>Try Again</button>
             </div>
         </div>
       );
  }

  // --- Main Page Render ---
  return (
    <div className="profile-page">
      <Header
        userName={userName}                     // From useAuth
        profilePictureUrl={userData?.profilePictureUrl}
        onLogout={logout}                     // From useAuth
        searchQuery={searchQuery}             // From useSearch
        onSearchChange={handleSearch}         // From useSearch
        onNotificationClick={handleNotificationClick} // From usePageLogic
      />

      <main className="browse-page-container">
        {/* Search Bar */}
        <div className="browse-search-bar">
           <span className="browse-search-icon"><Icons.Search /></span>
           <input
             type="text"
             className="browse-search-input"
             placeholder="Search for textbooks, electronics, and more..."
             value={searchQuery}             // From useSearch
             onChange={handleSearch}         // From useSearch
             aria-label="Search all listings"
           />
        </div>

        {/* For Sale Section */}
        <section className="browse-section">
          <h2 className="browse-section-title">For Sale</h2>
          {/* 'saleListings' now comes from useFilteredListings */}
          {saleListings.length > 0 ? (
            <div className="listing-grid">
              {saleListings.map(listing => (
                <ListingCard
                  key={listing.listingId}
                  listing={listing}
                  onClick={openModal}                   // From usePageLogic
                  isLiked={likedListingIds.has(listing.listingId)} // From usePageLogic
                  onLikeClick={handleLikeToggle}        // From usePageLogic
                  isOwner={userData?.userId === listing.user?.userId} // Prop from original code
                  currentUserId={userData?.userId}      // From useAuth
                  isLiking={likingInProgress.has(listing.listingId)} // From usePageLogic
                />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No items found for sale {searchQuery ? 'matching your search' : ''}.</p>
          )}
        </section>

        {/* For Rent Section */}
        <section className="browse-section">
          <h2 className="browse-section-title">For Rent</h2>
          {/* 'rentListings' now comes from useFilteredListings */}
           {rentListings.length > 0 ? (
            <div className="listing-grid">
              {rentListings.map(listing => (
                <ListingCard
                  key={listing.listingId}
                  listing={listing}
                  onClick={openModal}                   // From usePageLogic
                  isLiked={likedListingIds.has(listing.listingId)} // From usePageLogic
                  onLikeClick={handleLikeToggle}        // From usePageLogic
                  isOwner={userData?.userId === listing.user?.userId} // Prop from original code
                  currentUserId={userData?.userId}      // From useAuth
                  isLiking={likingInProgress.has(listing.listingId)} // From usePageLogic
                />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No items found for rent {searchQuery ? 'matching your search' : ''}.</p>
          )}
        </section>

        {/* Call to Action Card */}
        <section className="content-card cta-card">
          <h2 className="cta-title">Have items to sell or rent?</h2>
          <p className="cta-subtitle">
            Turn your unused items into cash by listing them on Edu-Rent.
          </p>
          <Link to="/list-item" className="cta-button">Start Selling Today</Link>
        </section>
      </main>

      {/* Modal rendering is now handled by this single component from usePageLogic */}
      <ModalComponent />
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';

// Import custom hooks
import useAuth from '../hooks/useAuth';
import useSearch from '../hooks/useSearch';
import usePageLogic from '../hooks/usePageLogic';
import useLikes from '../hooks/useLikes';
import { useAuthModal } from '../context/AuthModalContext';

// Import UI components
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import PaginationControls from '../components/PaginationControls';
import LoadMoreButton from '../components/LoadMoreButton';

// Import API service
import { getListingsByType } from '../services/apiService';

// Import styles
import '../static/BrowsePage.css';
import '../static/DashboardPage.css';

// Simple SVG icon for the search bar
const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  ),
};

export default function ForRentPage() {
  const navigate = useNavigate();
  const { userData, userName, logout, retryAuth, authError } = useAuth();
  const { openLogin } = useAuthModal();

  // Local state for handling paginated data
  const [listings, setListings] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Likes and Page Logic
  const likesHook = useLikes();
  const { likedListingIds, likingInProgress, isLoadingLikes, likeError, handleLikeToggle, refetchLikes } = likesHook;
  const { openModal, handleNotificationClick, ModalComponent } = usePageLogic(userData, likesHook, listings); 

  // Fetches only "Rent" type listings from the server
  const fetchData = useCallback(async (page = 0, isLoadMore = false) => {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingData(true);
        setDataError(null);
      }

      try {
          const response = await getListingsByType('rent', page, 8); 
          const data = response.data;
          
          if (data.content) {
              setListings(prev => page === 0 ? data.content : [...prev, ...data.content]);
              setCurrentPage(data.number);
              setTotalPages(data.totalPages);
              setHasMore(data.number < data.totalPages - 1);
          } else {
              setListings(data || []);
              setHasMore(false);
          }
      } catch (err) {
          console.error("Failed to load rent listings", err);
          setDataError("Could not load rental items. Please try again later.");
      } finally {
          if (isLoadMore) {
            setIsLoadingMore(false);
          } else {
            setIsLoadingData(false);
          }
      }
  }, []);

  // Trigger fetch on component mount
  useEffect(() => {
      fetchData(0);
  }, [fetchData]);

  // Filters the *current page* of listings based on search query
  const { searchQuery, handleSearch, filteredListings } = useSearch(
    listings, 
    ['title', 'description', 'category.name']
  );

  // Combine loading and error states
  const isPageLoading = isLoadingData || isLoadingLikes;
  const pageError = authError || dataError || likeError;

  const handleRetry = () => {
    if (authError) retryAuth();
    if (likeError) refetchLikes();
    fetchData(currentPage); // Retry fetching the current data page
  };

  // Render skeleton while loading
  if (isPageLoading) {
    return (
        <div className="profile-page">
            <Header userName="" onLogout={logout} />
            <main className="browse-page-container">
                <div className="browse-search-bar skeleton" style={{ height: '60px', marginBottom: '2rem' }}></div>
                <ListingGridSkeleton count={8} />
            </main>
        </div>
    );
  }

  // Error boundary
  if (pageError) {
    return (
      <div className="profile-page">
          <Header userName={userName} onLogout={logout} searchQuery="" onSearchChange={()=>{}} />
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{color: 'red', marginBottom: '1rem'}}>Error: {pageError}</div>
            <button className="error-retry-btn" onClick={handleRetry}>Try Again</button>
          </div>
      </div>
    );
  }

  // Handler for button
  const handleLoadMore = () => {
      if (!isLoadingMore) {
        fetchData(currentPage + 1, true);
      }
  };

  return (
    <div className="profile-page">
      <Header
        userName={userName}             
        profilePictureUrl={userData?.profilePictureUrl}
        onLogout={logout}             
        searchQuery={searchQuery}     
        onSearchChange={handleSearch} 
        onNotificationClick={handleNotificationClick} 
      />

      <main className="browse-page-container">
        {/* Search Bar */}
        <div className="browse-search-bar">
           <span className="browse-search-icon"><Icons.Search /></span>
           <input
             type="text"
             className="browse-search-input"
             placeholder="Search for items to rent..."
             value={searchQuery}
             onChange={handleSearch}
             aria-label="Search items for rent"
           />
        </div>

        {/* Listings Grid */}
        <section className="browse-section">
          <h2 className="browse-section-title">Items For Rent</h2>
          
          {filteredListings.length > 0 ? (
            <>
                <div className="listing-grid">
                  {filteredListings.map(listing => (
                    <ListingCard 
                      key={listing.listingId} 
                      listing={listing} 
                      onClick={openModal}                     
                      isLiked={likedListingIds.has(listing.listingId)} 
                      onLikeClick={handleLikeToggle}          
                      isOwner={userData?.userId === listing.user?.userId} 
                      currentUserId={userData?.userId}        
                      isLiking={likingInProgress.has(listing.listingId)} 
                    />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                <LoadMoreButton 
                    onLoadMore={handleLoadMore}
                    isLoading={isLoadingMore}
                    hasMore={hasMore}
                />
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              No items found for rent {searchQuery ? 'matching your search' : ''}.
            </p>
          )}
        </section>

        {/* Call to Action */}
        <section className="content-card cta-card">
           <h2 className="cta-title">Have items to sell or rent?</h2>
           <p className="cta-subtitle">
             Turn your unused items into cash by listing them on Edu-Rent.
           </p>
           <button className="cta-button" onClick={() => userData ? navigate('/list-item') : openLogin('/list-item')}>
             Start Selling Today
           </button>
        </section>
      </main>

      <ModalComponent />
    </div>
  );
}
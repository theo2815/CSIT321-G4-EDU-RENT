import React, { useState, useEffect, useCallback } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom';

// Import custom hooks that handle logic separately to keep this component clean
import useAuth from '../hooks/useAuth';
// import useSearch from '../hooks/useSearch'; // Removed in refactor
import useFilteredListings from '../hooks/useFilteredListings';
import usePageLogic from '../hooks/usePageLogic';
import useLikes from '../hooks/useLikes';
import { useAuthModal } from '../hooks/useAuthModal';

// Import UI components
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
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

export default function BrowsePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check who is currently logged in and get their details
  const { userData, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();

  const { openLogin } = useAuthModal();

  // --- SALE Section State ---
  const [saleListings, setSaleListings] = useState([]);
  const [isLoadingSale, setIsLoadingSale] = useState(true);
  const [isLoadingMoreSale, setIsLoadingMoreSale] = useState(false);
  const [saleError, setSaleError] = useState(null);
  const [salePage, setSalePage] = useState(0);
  const [hasMoreSale, setHasMoreSale] = useState(false);
  const [totalSaleElements, setTotalSaleElements] = useState(0);

  // --- RENT Section State ---
  const [rentListings, setRentListings] = useState([]);
  const [isLoadingRent, setIsLoadingRent] = useState(true);
  const [isLoadingMoreRent, setIsLoadingMoreRent] = useState(false);
  const [rentError, setRentError] = useState(null);
  const [rentPage, setRentPage] = useState(0);
  const [hasMoreRent, setHasMoreRent] = useState(false);
  const [totalRentElements, setTotalRentElements] = useState(0);

  // --- Fetch Sale Listings ---
  const fetchSaleListings = useCallback(async (page = 0, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMoreSale(true);
    } else {
      setIsLoadingSale(true);
      setSaleError(null);
    }

    try {
      const response = await getListingsByType('sale', page, 8);
      const data = response.data;

      if (data.content) {
        setSaleListings(prev => page === 0 ? data.content : [...prev, ...data.content]);
        setSalePage(data.number);
        setHasMoreSale(data.number < data.totalPages - 1);
        setTotalSaleElements(data.totalElements || 0);
      } else {
        setSaleListings(data || []);
        setHasMoreSale(false);
        setTotalSaleElements(0);
      }
    } catch (err) {
      console.error("Failed to load sale listings:", err);
      if (!isLoadMore) setSaleError("Could not load items for sale.");
    } finally {
      if (isLoadMore) {
        setIsLoadingMoreSale(false);
      } else {
        setIsLoadingSale(false);
      }
    }
  }, []);

  // --- Fetch Rent Listings ---
  const fetchRentListings = useCallback(async (page = 0, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMoreRent(true);
    } else {
      setIsLoadingRent(true);
      setRentError(null);
    }

    try {
      const response = await getListingsByType('rent', page, 8);
      const data = response.data;

      if (data.content) {
        setRentListings(prev => page === 0 ? data.content : [...prev, ...data.content]);
        setRentPage(data.number);
        setHasMoreRent(data.number < data.totalPages - 1);
        setTotalRentElements(data.totalElements || 0);
      } else {
        setRentListings(data || []);
        setHasMoreRent(false);
        setTotalRentElements(0);
      }
    } catch (err) {
      console.error("Failed to load rent listings:", err);
      if (!isLoadMore) setRentError("Could not load items for rent.");
    } finally {
      if (isLoadMore) {
        setIsLoadingMoreRent(false);
      } else {
        setIsLoadingRent(false);
      }
    }
  }, []);

  // --- Initial Data Load ---
  useEffect(() => {
    fetchSaleListings(0, false);
    fetchRentListings(0, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Load More Handlers ---
  const handleLoadMoreSale = () => {
    if (!isLoadingMoreSale && hasMoreSale) {
      fetchSaleListings(salePage + 1, true);
    }
  };

  const handleLoadMoreRent = () => {
    if (!isLoadingMoreRent && hasMoreRent) {
      fetchRentListings(rentPage + 1, true);
    }
  };

  // --- Search Functionality ---
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const searchKeys = ['title', 'description', 'category.name'];

  // Apply search to sale listings
  const filteredSale = useFilteredListings(
    saleListings, 
    'all', 
    searchQuery, 
    searchKeys
  );

  // Apply search to rent listings
  const filteredRent = useFilteredListings(
    rentListings, 
    'all', 
    searchQuery, 
    searchKeys
  );
  
  // Handle the logic for liking and unliking items
  const likesHook = useLikes();
  const { 
    likedListingIds, 
    likingInProgress, 
    isLoadingLikes, 
    likeError, 
    handleLikeToggle,
    refetchLikes,
  } = likesHook;

  // Track previous userData to detect login/logout transitions
  const prevUserData = React.useRef(userData);
  
  // Auto-update URL and refresh data: Handle login/logout transitions
  React.useEffect(() => {
    const wasLoggedIn = !!prevUserData.current;
    const wasGuest = !prevUserData.current;
    const isNowLoggedIn = !!userData;
    const isNowGuest = !userData;
    
    // Detect login transition (was guest, now logged in)
    if (wasGuest && isNowLoggedIn) {
      refetchLikes(true);
      if (location.pathname === '/guest/browse') {
        window.history.replaceState(null, '', '/browse');
      }
    }
    
    // Detect logout transition (was logged in, now guest)
    if (wasLoggedIn && isNowGuest) {
      refetchLikes(true);
      if (location.pathname === '/browse') {
        window.history.replaceState(null, '', '/guest/browse');
      }
    }
    
    prevUserData.current = userData;
  }, [userData, location.pathname, refetchLikes]);

  // Manage UI interactions like opening modals and handling notifications
  const { 
    openModal,
    handleNotificationClick, 
    ModalComponent
  } = usePageLogic(userData, likesHook, [...(saleListings || []), ...(rentListings || [])]);

  // Check if any part of the page is still loading (initial load only)
  const isPageLoading = isLoadingAuth || (isLoadingSale || isLoadingRent) || isLoadingLikes;
  
  // Check if any part of the page encountered an error
  const pageError = authError || likeError;
  const dataError = saleError && rentError ? "Could not load listings." : null;

  // Try to reload the specific part that failed
  const handleRetry = () => {
    if (authError) retryAuth();
    if (saleError) fetchSaleListings(0, false);
    if (rentError) fetchRentListings(0, false);
    if (likeError) refetchLikes();
  };

  // Show a skeleton loader while we wait for the data to arrive
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

  // Display an error message if something went wrong, with a button to try again
  if (pageError || dataError) {
       return (
         <div className="profile-page">
             <Header userName={userName} onLogout={logout} searchQuery="" onSearchChange={()=>{}} />
             <div style={{ padding: '2rem', textAlign: 'center' }}>
               <div style={{color: 'red', marginBottom: '1rem'}}>Error: {pageError || dataError}</div>
               <button className="error-retry-btn" onClick={handleRetry}>Try Again</button>
             </div>
         </div>
       );
  }

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
        {/* Main Search Bar */}
        <div className="browse-search-bar">
           <span className="browse-search-icon"><Icons.Search /></span>
           <input
             type="text"
             className="browse-search-input"
             placeholder="Search for textbooks, electronics, and more..."
             value={searchQuery}             
             onChange={handleSearch}         
             aria-label="Search all listings"
           />
        </div>

        {/* Section: Items For Sale */}
        <section className="browse-section">
          <h2 className="browse-section-title">For Sale</h2>
          {filteredSale.length > 0 ? (
            <>
              <div className="listing-grid">
                {filteredSale.map(listing => (
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
              {totalSaleElements > 8 && (
                <LoadMoreButton 
                  onLoadMore={handleLoadMoreSale}
                  isLoading={isLoadingMoreSale}
                  hasMore={hasMoreSale && !searchQuery}
                />
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No items found for sale {searchQuery ? 'matching your search' : ''}.</p>
          )}
        </section>

        {/* Section: Items For Rent */}
        <section className="browse-section">
          <h2 className="browse-section-title">For Rent</h2>
           {filteredRent.length > 0 ? (
            <>
              <div className="listing-grid">
                {filteredRent.map(listing => (
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
              {totalRentElements > 8 && (
                <LoadMoreButton 
                  onLoadMore={handleLoadMoreRent}
                  isLoading={isLoadingMoreRent}
                  hasMore={hasMoreRent && !searchQuery}
                />
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No items found for rent {searchQuery ? 'matching your search' : ''}.</p>
          )}
        </section>

        {/* Call to Action for new sellers */}
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

      {/* Renders the detail modal when an item is clicked */}
      <ModalComponent />
    </div>
  );
}
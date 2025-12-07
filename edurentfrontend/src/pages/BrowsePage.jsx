import React from 'react'; 
import { Link, useNavigate } from 'react-router-dom';

// Import custom hooks that handle logic separately to keep this component clean
import useAuth from '../hooks/useAuth';
import usePageData from '../hooks/usePageData';
import useSearch from '../hooks/useSearch';
import usePageLogic from '../hooks/usePageLogic';
import useFilteredListings from '../hooks/useFilteredListings'; 
import useLikes from '../hooks/useLikes';
import { useAuthModal } from '../context/AuthModalContext';

// Import UI components
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';

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

  // Check who is currently logged in and get their details
  const { userData, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();

  // Load the latest listings and categories from the server
  const { allListings, categories, isLoadingData, dataError, refetchData } = usePageData(!!userData);

  const { openLogin } = useAuthModal();

  // Filter the available listings based on what the user types in the search bar
  const { searchQuery, handleSearch, filteredListings } = useSearch(
    allListings,
    ['title', 'description', 'category.name'] 
  );
  
  // Handle the logic for liking and unliking items
  const likesHook = useLikes();
  const { 
    likedListingIds, 
    likingInProgress, 
    isLoadingLikes, 
    likeError, 
    handleLikeToggle,
    refetchLikes
  } = likesHook;

  // Manage UI interactions like opening modals and handling notifications
  const { 
    openModal,
    handleNotificationClick, 
    ModalComponent
  } = usePageLogic(userData, likesHook);

  // Separate the search results into 'For Sale' and 'For Rent' lists for display
  const saleListings = useFilteredListings(filteredListings, 'sale');
  const rentListings = useFilteredListings(filteredListings, 'rent');

  // Check if any part of the page is still loading
  const isPageLoading = isLoadingAuth || isLoadingData || isLoadingLikes;
  
  // Check if any part of the page encountered an error
  const pageError = authError || dataError || likeError;

  // Try to reload the specific part that failed
  const handleRetry = () => {
    if (authError) retryAuth();
    if (dataError) refetchData();
    if (likeError) refetchLikes();
    
    if (!authError && !dataError && !likeError) {
      retryAuth();
      refetchData();
      refetchLikes();
    }
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
          {saleListings.length > 0 ? (
            <div className="listing-grid">
              {saleListings.map(listing => (
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
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No items found for sale {searchQuery ? 'matching your search' : ''}.</p>
          )}
        </section>

        {/* Section: Items For Rent */}
        <section className="browse-section">
          <h2 className="browse-section-title">For Rent</h2>
           {rentListings.length > 0 ? (
            <div className="listing-grid">
              {rentListings.map(listing => (
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
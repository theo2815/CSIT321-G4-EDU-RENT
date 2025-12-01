import React from 'react'; 
import { Link, useNavigate } from 'react-router-dom';

// Import custom hooks to handle page logic
import useAuth from '../hooks/useAuth';
import usePageData from '../hooks/usePageData';
import useSearch from '../hooks/useSearch';
import usePageLogic from '../hooks/usePageLogic';
import useFilteredListings from '../hooks/useFilteredListings'; 
import useLikes from '../hooks/useLikes';

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

export default function ForSalePage() {
  const navigate = useNavigate(); 

  // Get current user details and authentication status
  const { userData, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();

  // Load all listings from the server
  const { allListings, isLoadingData, dataError, refetchData } = usePageData(!!userData);
  
  // Create a specific list containing only items available for sale
  const saleListings = useFilteredListings(allListings, 'sale');
  
  // Filter the sale list based on what the user types in the search bar
  const { searchQuery, handleSearch, filteredListings } = useSearch(
    saleListings, 
    ['title', 'description', 'category.name']
  );

  // Manage the logic for liking and unliking items
  const likesHook = useLikes();
  const { 
    likedListingIds, 
    likingInProgress, 
    isLoadingLikes, 
    likeError, 
    handleLikeToggle,
    refetchLikes
  } = likesHook;

  // Handle UI interactions like opening the detail modal and notifications
  const { 
    openModal,
    handleNotificationClick, 
    ModalComponent
  } = usePageLogic(userData, likesHook); 

  // Check if any part of the page is still loading or has encountered an error
  const isPageLoading = isLoadingAuth || isLoadingData || isLoadingLikes;
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
  
  // Show a skeleton loader while waiting for data
  if (isPageLoading) {
    return (
        <div className="profile-page">
            <Header userName="" onLogout={logout} searchQuery="" onSearchChange={()=>{}} />
            <main className="browse-page-container">
                <div className="browse-search-bar skeleton" style={{ height: '60px', marginBottom: '2rem' }}></div>
                <section className="browse-section">
                    <div className="skeleton skeleton-listing-text" style={{ height: '2rem', width: '200px', marginBottom: '1.5rem' }}></div>
                    <ListingGridSkeleton count={8} />
                </section>
            </main>
        </div>
    );
  }
  
  // Display an error message if something went wrong
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
        {/* Search Bar specific to items for sale */}
        <div className="browse-search-bar">
           <span className="browse-search-icon"><Icons.Search /></span>
           <input
             type="text"
             className="browse-search-input"
             placeholder="Search for items to buy..."
             value={searchQuery}
             onChange={handleSearch}
             aria-label="Search items for sale"
           />
        </div>

        {/* List of items available for sale */}
        <section className="browse-section">
          <h2 className="browse-section-title">Items For Sale</h2>
          
          {filteredListings.length > 0 ? (
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
          ) : (
            // Message shown when search returns no results
            <p style={{ color: 'var(--text-muted)' }}>
              No items found for sale {searchQuery ? 'matching your search' : ''}.
            </p>
          )}
        </section>

        {/* Call to Action for new sellers */}
        <section className="content-card cta-card">
          <h2 className="cta-title">Have items to sell or rent?</h2>
          <p className="cta-subtitle">
            Turn your unused items into cash by listing them on Edu-Rent.
          </p>
          <Link to="/list-item" className="cta-button">Start Selling Today</Link>
        </section>
      </main>

      {/* Renders the detail modal when an item is clicked */}
      <ModalComponent />
    </div>
  );
}
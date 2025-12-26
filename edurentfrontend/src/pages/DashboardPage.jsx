import React from 'react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Import our custom hooks to keep the logic organized
import useAuth from '../hooks/useAuth';
import usePageLogic from '../hooks/usePageLogic';   
import usePageData from '../hooks/usePageData';     
import useSearch from '../hooks/useSearch';       
import useLikes from '../hooks/useLikes';
import { useAuthModal } from '../context/AuthModalContext';
import LoadMoreButton from '../components/LoadMoreButton';

// Import UI components
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton'; 
import Header from '../components/Header';

// Import styles
import '../static/DashboardPage.css';
import dashboardImg from '../assets/dashboard.png';

// Shows a placeholder layout while data is loading so the page doesn't feel empty
function LoadingSkeleton() {
  return (
    <div className="dashboard-body">
      <div className="content-card skeleton skeleton-hero"></div>
      <section>
        <div className="skeleton skeleton-text large" style={{ width: '200px', height: '1.75rem', marginBottom: '1.5rem' }}></div>
        <div className="category-grid">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton skeleton-text" style={{ height: '80px', borderRadius: '8px' }}></div>
          ))}
        </div>
      </section>
      <section>
        <div className="skeleton skeleton-text large" style={{ width: '250px', height: '1.75rem', marginBottom: '1.5rem' }}></div>
        <ListingGridSkeleton count={3} />
      </section>
      <section>
        <div className="skeleton skeleton-text large" style={{ width: '200px', height: '1.75rem', marginBottom: '1.5rem' }}></div>
        <ListingGridSkeleton count={6} />
      </section>
    </div>
  );
}

// Displays a friendly error message and a retry button if something breaks
function ErrorBoundary({ error, onRetry }) {
  return (
    <div className="error-container">
      <div className="error-title">⚠️ Something went wrong</div>
      <div className="error-message">{error}</div>
      <button className="error-retry-btn" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

// A simple clickable card for a single category
function CategoryCardComponent({ category }) {
  return (
    <Link to={`/category/${category.categoryId}`} style={{ textDecoration: 'none' }}> 
      <div className="category-card">
        <div style={{ textAlign: 'center' }}>
          <div>{category.name}</div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  
  // Check who is logged in and get their profile info
  const { userData, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();
  const location = useLocation();
  
  // Fetch the main content (listings and categories) from the server
  const { 
    allListings, 
    categories, 
    isLoadingData,
    isLoadingMore, 
    dataError, 
    loadMore, 
    hasMore,
    refetchData,
    totalElements
  } = usePageData(!!userData);

  const { openLogin } = useAuthModal();
  
  // Handle the search bar logic to filter the listings
  const { searchQuery, handleSearch, filteredListings } = useSearch(
    allListings,
    ['title', 'description', 'category.name'] 
  );

  // Manage the 'like' heart button logic
  const likesHook = useLikes();
  const { 
    likedListingIds, 
    likingInProgress, 
    isLoadingLikes, 
    likeError, 
    handleLikeToggle,
    refetchLikes
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
      refetchLikes(true); // Silent refresh
      if (location.pathname === '/guest/dashboard') {
        window.history.replaceState(null, '', '/dashboard');
      }
    }
    
    // Detect logout transition (was logged in, now guest)
    if (wasLoggedIn && isNowGuest) {
      refetchLikes(true); // This will clear likes since there's no token
      if (location.pathname === '/dashboard') {
        window.history.replaceState(null, '', '/guest/dashboard');
      }
    }
    
    // Update ref for next render
    prevUserData.current = userData;
  }, [userData, location.pathname, refetchLikes]);

  // Handle UI interactions like opening the item detail modal
  const { 
    openModal,
    handleNotificationClick, 
    ModalComponent
  } = usePageLogic(userData, likesHook, allListings); 
  
  const navigate = useNavigate(); 

  // If something fails, this function tries to reload everything
  const handleRetry = () => {
    if (authError) retryAuth();
    if (dataError) refetchData();
    if (likeError) refetchLikes();
    
    // If we don't know exactly what failed, just try everything
    if (!authError && !dataError && !likeError) {
       retryAuth();   
       refetchData();
       refetchLikes();
    }
  };

  // Check if we are still loading or if there's an error
  const isPageLoading = isLoadingAuth || isLoadingData || isLoadingLikes;
  const pageError = authError || dataError || likeError;

  // Show the skeleton loader while we wait for data
  if (isPageLoading) {
    return (
      <div className="dashboard-page">
        <Header 
          userName="" 
          searchQuery="" 
          onSearchChange={() => {}} 
          onLogout={logout}
        />
        <LoadingSkeleton />
      </div>
    );
  }

  // Show the error screen if something went wrong
  if (pageError) {
    return (
      <div className="dashboard-page">
        <Header 
          userName={userName} 
          onLogout={logout}
          searchQuery="" 
          onSearchChange={() => {}} 
        />
        <main className="dashboard-body">
          <ErrorBoundary error={pageError} onRetry={handleRetry} />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">   
      <Header 
        userName={userName}                 
        profilePictureUrl={userData?.profilePictureUrl}
        searchQuery={searchQuery}         
        onSearchChange={handleSearch}     
        onLogout={logout}                 
        onNotificationClick={handleNotificationClick} 
      />

      <main className="dashboard-body">
        {/* Welcome Banner */}
        <section 
          className="content-card hero-card"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${dashboardImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            minHeight: '320px',
            padding: '3rem 2rem'
          }}
        >
          <div style={{ maxWidth: '700px', width: '100%' }}>
            <h1 className="hero-title" style={{ color: 'white', marginBottom: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              Your Campus Marketplace for Students
            </h1>
            <p className="hero-subtitle" style={{ color: 'rgba(255, 255, 255, 0.95)', marginBottom: '2rem', fontWeight: 500 }}>
              Edu-Rent makes it easy to rent, buy, and sell items within your university community. Find textbooks, electronics, and more.
            </p>
            <Link to="/browse" className="hero-button" style={{ border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              Browse All Items
            </Link>
          </div>
        </section>

        {/* Categories List */}
        <section>
          <h2 className="section-title">Explore by Category</h2>
           {categories.length > 0 ? ( 
             <div className="category-grid">
               {categories.slice(0, 5).map(category => (
                 <CategoryCardComponent key={category.categoryId} category={category} />
               ))}
             </div>
           ) : (
             <p style={{color: 'var(--text-muted)'}}>No categories found.</p>
           )}
        </section>

        {/* Featured Items (Top 3) */}
        <section>
          <h2 className="section-title">🌟 Featured Items</h2>
          {filteredListings.length > 0 ? (
            <div className="listing-grid">
              {filteredListings.slice(0, 3).map(listing => (
                <ListingCard 
                  key={listing.listingId} 
                  listing={listing} 
                  onClick={openModal}                   
                  isLiked={likedListingIds.has(listing.listingId)} 
                  onLikeClick={handleLikeToggle}        
                  currentUserId={userData?.userId}      
                  isLiking={likingInProgress.has(listing.listingId)} 
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">✨</div>
              <div className="empty-state-title">No Featured Items</div>
              <p>Check back soon for featured listings!</p>
            </div>
          )}
        </section>

        {/* All Available Items */}
        <section>
          <h2 className="section-title">📦 All Listings</h2>
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
                  currentUserId={userData?.userId}      
                  isLiking={likingInProgress.has(listing.listingId)} 
                />
              ))}
            </div>
            {Number(totalElements) > 8 && allListings.length < totalElements && (
                <LoadMoreButton 
                        onLoadMore={loadMore}
                        isLoading={isLoadingMore}
                        hasMore={hasMore}
                    />
            )}
            </>
          ) : (
            // Show this if the search returns no results
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No Listings Found</div>
              <p>{searchQuery ? 'Try adjusting your search terms' : 'No listings available at the moment'}</p>
            </div>
          )}
        </section>

        {/* Call to Action for new sellers */}
        <section className="content-card cta-card">
          <h2 className="cta-title">Have items to sell or rent?</h2>
          <p className="cta-subtitle">
            Turn your unused items into cash by listing them on Edu-Rent.
          </p>
          <button 
            className="cta-button" 
            onClick={() => userData ? navigate('/list-item') : openLogin('/list-item')}
          >
            Start Selling Today
          </button>
        </section>
      </main>

      {/* Renders the item detail modal when needed */}
      <ModalComponent />
      
    </div>
  );
}
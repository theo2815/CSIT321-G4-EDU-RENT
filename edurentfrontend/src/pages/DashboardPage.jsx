import React, { useEffect } from 'react'; // React, and useEffect (no more useState/useCallback)
import { Link, useNavigate } from 'react-router-dom';

// --- Import Hooks ---
import useAuth from '../hooks/useAuth';
import usePageLogic from '../hooks/usePageLogic';   // Manages Likes, Modals, Notifications
import usePageData from '../hooks/usePageData';     // Manages Listings & Categories
import useSearch from '../hooks/useSearch';       // Manages Search
import useLikes from '../hooks/useLikes';

// --- Import Components ---
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton'; 
import Header from '../components/Header';

// --- Import CSS ---
import '../static/DashboardPage.css';

// --- Page-Specific Sub-Component: LoadingSkeleton ---
// This component shows a placeholder while data is loading.
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

// --- Page-Specific Sub-Component: ErrorBoundary ---
// This component displays a helpful message if an error occurs.
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

// --- Page-Specific Sub-Component: CategoryCardComponent ---
// This component renders a single category card.
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

// --- Main Page Component: DashboardPage ---
export default function DashboardPage() {
  
  // 1. Authentication Hook: Manages user data and login status.
  const { userData, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();
  
  // 2. Page Data Hook: Fetches listings and categories when the user is logged in (!!userData).
  const { allListings, categories, isLoadingData, dataError, refetchData } = usePageData(!!userData);
  
  // 3. Search Hook: Handles search state and filters the 'allListings' list.
  const { searchQuery, handleSearch, filteredListings } = useSearch(
    allListings,
    ['title', 'description', 'category.name'] // Keys to search against
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
  
  const navigate = useNavigate(); // Standard React Router hook for navigation

  // --- All component state (useState) and logic functions are now in the hooks ---

  // New retry handler that can refetch data from any hook that failed.
  const handleRetry = () => {
    if (authError) retryAuth();
    if (dataError) refetchData();
    if (likeError) refetchLikes();
    
    // Fallback if no specific error is set
    if (!authError && !dataError && !likeError) {
       retryAuth();   // Try all again
       refetchData();
       refetchLikes();
    }
  };

  // Aggregate loading and error states from all hooks.
  const isPageLoading = isLoadingAuth || isLoadingData || isLoadingLikes;
  const pageError = authError || dataError || likeError;

  // Render loading skeleton state
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

  // Render error boundary state
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

  // Render main dashboard content
  return (
    <div className="dashboard-page">   
      <Header 
        userName={userName}                 // From useAuth
        profilePictureUrl={userData?.profilePictureUrl}
        searchQuery={searchQuery}         // From useSearch
        onSearchChange={handleSearch}     // From useSearch
        onLogout={logout}                 // From useAuth
        onNotificationClick={handleNotificationClick} // From usePageLogic
      />

      <main className="dashboard-body">
        {/* Hero Card */}
        <section className="content-card hero-card">
          <div className="hero-left">
            <h1 className="hero-title">Your Campus Marketplace for Students</h1>
            <p className="hero-subtitle">
              Edu-Rent makes it easy to rent, buy, and sell items within your university community. Find textbooks, electronics, and more.
            </p>
            <Link to="/browse" className="hero-button">Browse All Items</Link>
          </div>
          <div className="hero-right">
            <div className="hero-image-placeholder">📚 Marketplace Hub</div>
          </div>
        </section>

        {/* Categories Section */}
        <section>
          <h2 className="section-title">Explore by Category</h2>
           {categories.length > 0 ? ( // Data from usePageData
             <div className="category-grid">
               {categories.slice(0, 5).map(category => (
                 <CategoryCardComponent key={category.categoryId} category={category} />
               ))}
             </div>
           ) : (
             <p style={{color: 'var(--text-muted)'}}>No categories found.</p>
           )}
        </section>

        {/* Featured Items Section */}
        <section>
          <h2 className="section-title">🌟 Featured Items</h2>
          {/* Data is now from 'filteredListings' (from useSearch) */}
          {filteredListings.length > 0 ? (
            <div className="listing-grid">
              {filteredListings.slice(0, 3).map(listing => (
                <ListingCard 
                  key={listing.listingId} 
                  listing={listing} 
                  onClick={openModal}                   // From usePageLogic
                  isLiked={likedListingIds.has(listing.listingId)} // From usePageLogic
                  onLikeClick={handleLikeToggle}        // From usePageLogic
                  currentUserId={userData?.userId}      // From useAuth
                  isLiking={likingInProgress.has(listing.listingId)} // From usePageLogic
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

        {/* All Listings Section */}
        <section>
          <h2 className="section-title">📦 All Listings</h2>
          {/* Data is now from 'filteredListings' (from useSearch) */}
          {filteredListings.length > 0 ? (
            <div className="listing-grid">
              {filteredListings.map(listing => (
                <ListingCard 
                  key={listing.listingId} 
                  listing={listing} 
                  onClick={openModal}                   // From usePageLogic
                  isLiked={likedListingIds.has(listing.listingId)} // From usePageLogic
                  onLikeClick={handleLikeToggle}        // From usePageLogic
                  currentUserId={userData?.userId}      // From useAuth
                  isLiking={likingInProgress.has(listing.listingId)} // From usePageLogic
                />
              ))}
            </div>
          ) : (
            // This empty state smartly checks if a search is active
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No Listings Found</div>
              <p>{searchQuery ? 'Try adjusting your search terms' : 'No listings available at the moment'}</p>
            </div>
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

      {/* Render the Modal component provided by usePageLogic */}
      <ModalComponent />
      
    </div>
  );
}
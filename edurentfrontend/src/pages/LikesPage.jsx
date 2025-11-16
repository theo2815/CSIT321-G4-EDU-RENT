import React from 'react'; // No more useState, useEffect, useCallback
import { Link, useNavigate } from 'react-router-dom';

// --- Import All Our Hooks ---
import useAuth from '../hooks/useAuth';
import useLikes from '../hooks/useLikes';
import usePageLogic from '../hooks/usePageLogic';

// --- Import Components ---
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
// Modals are handled by usePageLogic

// Import CSS
import '../static/LikesPage.css';
import '../static/DashboardPage.css'; // For shared grid and empty state styles

// --- Error Display Component (Helper) ---
function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="error-container" style={{ margin: '2rem auto', maxWidth: '600px'}}>
      <div className="error-title">⚠️ Something went wrong</div>
      <div className="error-message">{error}</div>
      <button className="error-retry-btn" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

// --- Main Page Component ---
export default function LikesPage() {
  
  // 1. Get Auth state (user, loading, error, logout)
  const { userData, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();

  // 2. Get Likes state (This is our MAIN data source for this page)
  const likesHook = useLikes(); // We get this to pass to usePageLogic
  const { 
    likedListings, // The full list of liked listing objects
    likedListingIds,
    likingInProgress,
    isLoadingLikes,
    likeError,
    handleLikeToggle, // This is the function from the hook
    refetchLikes
  } = likesHook;

  // 3. Get Modal logic (and pass in the likes data)
  const { 
    openModal,
    handleNotificationClick, 
    ModalComponent // This is the ready-to-render Modal component
  } = usePageLogic(userData, likesHook); // Pass the likesHook in

  // --- All other state and logic is now handled by hooks! ---

  // --- Combined Loading/Error States ---
  const isPageLoading = isLoadingAuth || isLoadingLikes;
  const pageError = authError || likeError;

  // This handler can retry auth or like-fetching
  const handleRetry = () => {
    if (authError) retryAuth();
    if (likeError) refetchLikes();
    // Fallback
    if (!authError && !likeError) {
       retryAuth();
       refetchLikes();
    }
  };
  
  /**
   * Renders the main content of the page based on loading, error, or data state.
   */
  const renderContent = () => {
    // Show skeleton while loading auth or likes
    if (isPageLoading) {
      return <ListingGridSkeleton count={4} />;
    }
    
    // Show a combined error message
    if (pageError) {
      return (
         <ErrorDisplay error={pageError} onRetry={handleRetry} />
      );
    }
    
    // Show empty state if the user has no likes
    if (likedListings.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">❤️</div>
          <div className="empty-state-title">No Favorites Yet</div>
          <p>Find something you like and tap the heart to save it.</p>
          <Link to="/browse" className="cta-button" style={{marginTop: '1rem'}}>
            Browse all items
          </Link>
        </div>
      );
    }
    
    // Render the grid of liked listings
    return (
      <div className="listing-grid">
        {likedListings.map(listing => (
          <ListingCard
            key={listing.listingId}
            listing={listing}
            onClick={openModal}
            isLiked={true} // Item on this page is always liked
            onLikeClick={handleLikeToggle} // This will unlike and remove it
            currentUserId={userData?.userId}
            isLiking={likingInProgress.has(listing.listingId)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="profile-page">
      <Header
        userName={userName}
        profilePictureUrl={userData?.profilePictureUrl}
        onLogout={logout}
        searchQuery="" // No search on this page
        onSearchChange={() => {}}
        onNotificationClick={handleNotificationClick}
      />

      <main className="likes-page-container">
        <h1 className="likes-page-title">❤️ Likes</h1>
        {renderContent()}
      </main>

      {/* Render the modal component from usePageLogic */}
      <ModalComponent />
    </div>
  );
}
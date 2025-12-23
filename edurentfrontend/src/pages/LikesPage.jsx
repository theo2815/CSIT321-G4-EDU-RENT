import React from 'react'; 
import { Link, useNavigate } from 'react-router-dom';

// Import custom hooks for state management
import useAuth from '../hooks/useAuth';
import useLikes from '../hooks/useLikes';
import usePageLogic from '../hooks/usePageLogic';

// Import UI Components
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';

// Import CSS
import '../static/LikesPage.css';
import '../static/DashboardPage.css'; 

// Reusable component to show error messages with a retry option
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

export default function LikesPage() {
  
  // Check user session status
  const { userData, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();

  // Fetch and manage the list of items the user has liked
  const likesHook = useLikes(); 
  const { 
    likedListings, 
    likedListingIds,
    likingInProgress,
    isLoadingLikes,
    likeError,
    handleLikeToggle, 
    refetchLikes
  } = likesHook;

  // Handle global UI logic like modals and notifications
  const { 
    openModal,
    handleNotificationClick, 
    ModalComponent 
  } = usePageLogic(userData, likesHook, likedListings); 

  // Consolidate loading and error flags from different sources
  const isPageLoading = isLoadingAuth || isLoadingLikes;
  const pageError = authError || likeError;

  // Attempt to reload data if something fails
  const handleRetry = () => {
    if (authError) retryAuth();
    if (likeError) refetchLikes();
    
    if (!authError && !likeError) {
       retryAuth();
       refetchLikes();
    }
  };
  
  // Helper to decide what content to show: loading, error, empty, or list
  const renderContent = () => {
    // Show a skeleton loader while waiting for data
    if (isPageLoading) {
      return <ListingGridSkeleton count={4} />;
    }
    
    // Display error if any occurred
    if (pageError) {
      return (
         <ErrorDisplay error={pageError} onRetry={handleRetry} />
      );
    }
    
    // Fallback UI when the user hasn't liked anything yet
    if (likedListings.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">❤️</div>
          <div className="empty-state-title">No Favorites Yet</div>
          <p>Find something you like and tap the heart to save it.</p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/browse" className="cta-button">
              Browse all items
            </Link>
          </div>
        </div>
      );
    }
    
    // Map through the liked items and display them
    return (
      <div className="listing-grid">
        {likedListings.map(listing => (
          <ListingCard
            key={listing.listingId}
            listing={listing}
            onClick={openModal}
            isLiked={true} // Since this is the Likes page, the item is always 'liked' initially
            onLikeClick={handleLikeToggle} // Toggling the heart here removes it from the list
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
        searchQuery="" 
        onSearchChange={() => {}}
        onNotificationClick={handleNotificationClick}
      />

      <main className="likes-page-container">
        <h1 className="likes-page-title">❤️ Likes</h1>
        {renderContent()}
      </main>

      {/* The detail modal, rendered via the page logic hook */}
      <ModalComponent />
    </div>
  );
}
// src/pages/ProfilePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// --- Import Hooks ---
import useAuth from '../hooks/useAuth';
import useLikes from '../hooks/useLikes';
import usePageLogic from '../hooks/usePageLogic';
import useSearch from '../hooks/useSearch';

// --- Import Components ---
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
// ProductDetailModal and Skeleton are now handled by usePageLogic

// --- Import API (Only what's unique to this page) ---
import { getUserListings, getUserReviews } from '../services/apiService';

// Import CSS & Assets
import '../static/ProfilePage.css';
import '../static/DashboardPage.css';
import ShareIcon from '../assets/share.png';
import defaultAvatar from '../assets/default-avatar.png'; // <-- IMPORT DEFAULT AVATAR

// --- Page-Specific Skeleton Component ---
function ProfileSkeleton() {
  return (
    <main className="dashboard-body">
      {/* Profile Card Skeleton */}
      <div className="content-card profile-card skeleton">
        <div className="profile-card-left skeleton skeleton-avatar" style={{width: '120px', height: '120px', borderRadius:'50%'}}></div>
        <div className="profile-card-center" style={{flexGrow: 1}}>
            <div className="skeleton skeleton-text large" style={{width: '60%', height: '2rem', marginBottom: '1rem'}}></div>
            <div className="skeleton skeleton-text medium" style={{width: '40%', height: '1rem', marginBottom: '1rem'}}></div>
        </div>
        <div className="profile-card-right">
            <div className="skeleton skeleton-text" style={{width: '80px', height: '1.5rem', marginBottom: '0.5rem'}}></div>
            <div className="skeleton skeleton-text" style={{width: '100px', height: '1rem', marginBottom: '0.5rem'}}></div>
            <div className="skeleton skeleton-text" style={{width: '120px', height: '1rem', marginBottom: '1rem'}}></div>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <div className="skeleton" style={{width: '100px', height: '30px', borderRadius: '6px'}}></div>
              <div className="skeleton" style={{width: '40px', height: '30px', borderRadius: '6px'}}></div>
            </div>
        </div>
      </div>

      {/* Listings/Reviews Section Skeleton */}
      <div className="content-card skeleton" style={{marginTop: '1.5rem'}}>
        {/* Skeleton Tabs */}
        <div className="profile-tabs" style={{ borderBottom: '1px solid var(--border-color-light)' }}>
          <div className="skeleton skeleton-text" style={{ width: '100px', height: '2rem', marginBottom: '-1px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '100px', height: '2rem', marginBottom: '-1px' }}></div>
        </div>

        {/* Skeleton Listing Grid */}
        <div className="profile-listings-section" style={{ paddingTop: '1.5rem' }}>
          <div className="profile-listings-header">
            <div className="skeleton skeleton-text" style={{ width: '150px', height: '1.75rem' }}></div>
            <div className="profile-listings-actions">
              <div className="skeleton" style={{ width: '200px', height: '40px', borderRadius: '6px' }}></div>
              <div className="skeleton" style={{ width: '150px', height: '40px', borderRadius: '6px' }}></div>
            </div>
          </div>
          <ListingGridSkeleton count={3} />
        </div>
      </div>
    </main>
  );
}

// --- Page-Specific Profile Details Modal (UPDATED) ---
function ProfileDetailsModal({ user, onClose }) {
  if (!user) return null;

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) // Use full date
    : 'N/A';

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay visible" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">About @{user.fullName?.split(' ')[0] || 'User'}</h2>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            &times;
          </button>
        </div>
        <div className="modal-body">
          {/* --- Bio Section Removed --- */}
          <ul className="modal-details-list">
            <li><strong>Joined:</strong> {joinedDate}</li>
            <li><strong>School:</strong> {user.school?.name || 'N/A'}</li>
            <li><strong>Location:</strong> {user.address || 'Not specified'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- Page-Specific Error Display Component ---
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

// --- Page-Specific Review Card Component (Already correct) ---
function ReviewCard({ review }) {
  const reviewerName = review.reviewer?.fullName || 'Anonymous';
  const reviewDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString()
    : 'N/A';

  return (
    <div className="review-card">
      <div className="review-header">
        <strong className="review-reviewer">{reviewerName}</strong>
        <span className="review-rating">
          {'⭐'.repeat(review.rating || 0)}
          {'☆'.repeat(5 - (review.rating || 0))}
        </span>
      </div>
      <p className="review-comment">{review.comment || 'No comment provided.'}</p>
      <small className="review-date">{reviewDate}</small>
    </div>
  );
}

// --- Main Profile Page Component ---
export default function ProfilePage() {
  
  // 1. Auth Hook: Manages user data, login status, and auth errors.
  const { userData, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();
  
  // 2. Likes Hook: Manages all like-related state and logic.
  const likesHook = useLikes();
  const { 
    likedListingIds, 
    likingInProgress, 
    isLoadingLikes, 
    likeError, 
    handleLikeToggle,
    refetchLikes
  } = likesHook;
  
  // 3. Page Logic Hook: Manages modals and notifications.
  const { 
    openModal,
    handleNotificationClick, 
    ModalComponent
  } = usePageLogic(userData, likesHook);
  
  // 4. Page-Specific State: Manages data unique to this page.
  const [originalListings, setOriginalListings] = useState([]); // Master list for search
  const [userReviews, setUserReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('listings');
  const [isLoadingPageData, setIsLoadingPageData] = useState(true); // Loading for listings/reviews
  const [pageDataError, setPageDataError] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // State for the *Profile* modal
  
  // 5. Search Hook: Handles search state and filters 'originalListings'.
  const { searchQuery, handleSearch, filteredListings: displayedListings } = useSearch(
    originalListings,
    ['title', 'description']
  );

  const navigate = useNavigate();

  // Fetches data specific to this page (listings, reviews)
  const fetchProfileData = useCallback(async (userId) => {
    setIsLoadingPageData(true);
    setPageDataError(null);
    try {
      const listingsPromise = getUserListings(userId);
      const reviewsPromise = getUserReviews(userId);
      refetchLikes(); // Refetch likes on profile load

      const [listingsResponse, reviewsResponse] = await Promise.all([
        listingsPromise,
        reviewsPromise
      ]);

      setOriginalListings(listingsResponse.data || []);
      setUserReviews(reviewsResponse.data || []);

    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      setPageDataError(err.message || "Could not load profile data.");
    } finally {
      setIsLoadingPageData(false);
    }
  }, [refetchLikes]); // Dependency array is correct

  // Fetch data only when the authenticated user is available
  useEffect(() => {
    if (userData) {
      fetchProfileData(userData.userId);
    }
  }, [userData, fetchProfileData]);

  // --- Page-Specific Handlers ---
  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  // This handler can retry auth, likes, or this page's specific data
  const handleRetry = () => {
    if (authError) retryAuth();
    if (pageDataError) fetchProfileData(userData.userId);
    if (likeError) refetchLikes();
  };
  
  // Handles sharing the user's profile link
  const handleShareProfile = () => {
    // (Handler logic is correct)
    const profileUrl = `${window.location.origin}/profile/${userData?.userId}`;
    const profileName = userData?.fullName || 'User';
    if (navigator.share) {
      navigator.share({ title: `${profileName}'s Profile on Edu-Rent`, text: `Check out ${profileName}'s profile on Edu-Rent!`, url: profileUrl })
        .catch(err => console.error("Share failed:", err));
    } else {
      navigator.clipboard.writeText(profileUrl)
       .then(() => alert('Profile link copied to clipboard!'))
       .catch(err => {
          console.error("Clipboard copy failed:", err);
          alert('Failed to copy link.');
       });
    }
  };

  // Calculates the average rating from reviews
  const averageRating = userReviews.length > 0
    ? (userReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / userReviews.length).toFixed(1)
    : 0;

  // --- Combined Loading/Error States ---
  const isPageLoading = isLoadingAuth || isLoadingPageData || isLoadingLikes;
  const pageError = authError || pageDataError || likeError;
  
  // --- Render Loading State ---
  if (isPageLoading) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={logout} />
        <ProfileSkeleton />
      </div>
    );
  }

  // --- Render Error State ---
  if (pageError) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={logout} />
        <main className="dashboard-body">
            <ErrorDisplay error={pageError} onRetry={handleRetry} />
        </main>
      </div>
    );
  }

  // --- Render Not Found State (Fallback) ---
  if (!userData) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={logout} />
        <main className="dashboard-body">
          <div className="empty-state">
             <div className="empty-state-icon">👤</div>
             <div className="empty-state-title">User Not Found</div>
             <p className="empty-state-description">
               Could not load user data. Please try logging in again.
             </p>
             <Link to="/login" className="empty-state-action">
               Go to Login
             </Link>
          </div>
        </main>
      </div>
    );
  }

  // Format join date once data is available
  const joinedDate = userData.createdAt 
    ? new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) 
    : 'N/A';

  // --- Render Profile Page ---
  return (
    <div className="profile-page">
      <Header
        userName={userName}
        profilePictureUrl={userData?.profilePictureUrl} // Pass the URL to the header
        onLogout={logout}
        onNotificationClick={handleNotificationClick}
      />

      <main className="dashboard-body">
        {/* Profile Section Card (UPDATED) */}
        <section className="content-card profile-card">
          <div className="profile-card-left">
            {/* --- UPDATED: Use defaultAvatar and onError --- */}
            <img 
              src={userData.profilePictureUrl ? `http://localhost:8080${userData.profilePictureUrl}` : defaultAvatar} 
              alt={`${userData.fullName}'s profile`} 
              className="profile-picture"
              onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
            />
          </div>
          <div className="profile-card-center">
            <h1 className="profile-name">{userData.fullName}</h1>
            <button onClick={openProfileModal} className="profile-details-link"> Profile Details &gt; </button>
          </div>
          <div className="profile-card-right">
            <div className="profile-card-rating"><span>⭐</span><span>{averageRating}</span></div>
            <div className="profile-card-reviews">{userReviews.length} reviews</div>
            <div className="profile-card-joined"><span>Joined </span><span>{joinedDate}</span></div>
            <div className="profile-card-actions">
              <button className="btn btn-small btn-primary" onClick={() => navigate('/settings/profile')}> Edit Profile </button>
              <button className="icon-button" onClick={handleShareProfile} title="Share profile">
                <img src={ShareIcon} alt="Share"/>
              </button>
            </div>
          </div>
        </section>

        {/* Listings & Reviews Section */}
        <section className="content-card">
          <div className="profile-tabs">
            <button className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
              Listings ({displayedListings.length})
            </button>
            <button className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
              Reviews ({userReviews.length})
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'listings' && (
              <div className="profile-listings-section">
                <div className="profile-listings-header">
                  <h2 className="profile-listings-title">Your Listings</h2>
                  <div className="profile-listings-actions">
                    <input
                      type="text"
                      placeholder="Search your listings..."
                      className="profile-search-input"
                      value={searchQuery}
                      onChange={handleSearch}
                      aria-label="Search your listings"
                    />
                    <button className="btn btn-small btn-primary-accent" onClick={() => navigate('/manage-listings')}>
                      Manage Listings
                    </button>
                  </div>
                </div>
                
                {displayedListings.length > 0 ? (
                  <div className="listing-grid">
                    {displayedListings.map((listing) => (
                      // --- UPDATED: Disable liking your own items ---
                      <ListingCard
                        key={listing.listingId}
                        listing={listing}
                        onClick={openModal}
                        currentUserId={userData?.userId}
                        isLiked={false}
                        onLikeClick={() => {}}
                        isLiking={false}
                      />
                    ))}
                  </div>
                ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <div className="empty-state-title"> {searchQuery ? 'No Listings Found' : 'No Listings Yet'} </div>
                      <p> {searchQuery ? 'Try adjusting your search' : "List an item!"} </p>
                      {!searchQuery && (<button className="empty-state-action" onClick={() => navigate('/list-item')}> Create Listing </button>)}
                    </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="profile-reviews-section">
                <h2 className="profile-listings-title" style={{ marginBottom: '1.5rem' }}>
                  Reviews Received
                </h2>
                {userReviews.length > 0 ? (
                  userReviews.map((review) => (
                    <ReviewCard key={review.reviewId} review={review} />
                  ))
                ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">⭐</div>
                      <div className="empty-state-title">No Reviews Yet</div>
                      <p>Complete transactions for reviews.</p>
                    </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      
      {/* This is the Page-Specific Profile Details Modal */}
      {isProfileModalOpen && <ProfileDetailsModal user={userData} onClose={closeProfileModal} />}
      
      {/* This is the Product Modal, rendered by the hook */}
      <ModalComponent />

    </div>
  );
}
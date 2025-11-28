// src/pages/ProfilePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios'; 

// --- Custom Hooks ---
// useAuth: Manages the current logged-in user's session and token
// useLikes: Handles the logic for liking/unliking items and tracking liked status
// usePageLogic: Centralizes modal states and common page interactions
// useSearch: Filters the listing array based on user input
import useAuth from '../hooks/useAuth';
import useLikes from '../hooks/useLikes';
import usePageLogic from '../hooks/usePageLogic';
import useSearch from '../hooks/useSearch';

// --- UI Components ---
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';

// --- API Services ---
import { getUserListings, getUserReviews, getCurrentUser } from '../services/apiService';

// --- Styles & Assets ---
import '../static/ProfilePage.css';
import '../static/DashboardPage.css';
import ShareIcon from '../assets/share.png';
import defaultAvatar from '../assets/default-avatar.png';

// Defined API URL for the fallback fetch function
const API_URL = 'http://localhost:8080/api/v1';

/**
 * Fallback function to fetch a specific user by ID.
 * This is used if the main apiService does not yet have a 'getUserById' function exported.
 * It manually retrieves the auth token to ensure the request is authorized.
 */
const fetchUserById = async (id) => {
  const storedData = localStorage.getItem('eduRentUserData');
  const token = storedData ? JSON.parse(storedData).token : null;
  
  return axios.get(`${API_URL}/users/${id}`, {
       headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
};

/**
 * Skeleton Loader Component
 * Displays a placeholder layout while profile data is being fetched from the backend.
 */
function ProfileSkeleton() {
  return (
    <main className="dashboard-body">
      {/* Profile Header Skeleton */}
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

      {/* Tabs and Listings Skeleton */}
      <div className="content-card skeleton" style={{marginTop: '1.5rem'}}>
        <div className="profile-tabs" style={{ borderBottom: '1px solid var(--border-color-light)' }}>
          <div className="skeleton skeleton-text" style={{ width: '100px', height: '2rem', marginBottom: '-1px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '100px', height: '2rem', marginBottom: '-1px' }}></div>
        </div>
        <div className="profile-listings-section" style={{ paddingTop: '1.5rem' }}>
          <div className="profile-listings-header">
            <div className="skeleton skeleton-text" style={{ width: '150px', height: '1.75rem' }}></div>
            <div className="profile-listings-actions">
              <div className="skeleton" style={{ width: '200px', height: '40px', borderRadius: '6px' }}></div>
            </div>
          </div>
          <ListingGridSkeleton count={3} />
        </div>
      </div>
    </main>
  );
}

/**
 * Profile Details Modal
 * Shows extended information about the user (Join date, School, Location).
 */
function ProfileDetailsModal({ user, onClose }) {
  if (!user) return null;

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  // Close modal if the user clicks the dark overlay background
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay visible" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">About @{user.fullName?.split(' ')[0] || 'User'}</h2>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">&times;</button>
        </div>
        <div className="modal-body">
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

/**
 * Error Display Component
 * Renders a user-friendly error message with a retry button.
 */
function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="error-container" style={{ margin: '2rem auto', maxWidth: '600px'}}>
      <div className="error-title">⚠️ Something went wrong</div>
      <div className="error-message">{error}</div>
      <button className="error-retry-btn" onClick={onRetry}>Try Again</button>
    </div>
  );
}

/**
 * Review Card Component
 * Displays individual reviews with star ratings and timestamps.
 */
function ReviewCard({ review }) {
  const reviewerName = review.reviewer?.fullName || 'Anonymous';
  const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A';

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

/**
 * Main Profile Page Component
 * Handles displaying user profiles, distinguishing between "My Profile" and "Public Profiles".
 */
export default function ProfilePage() {
  
  // Retrieve profileId from the URL parameters (e.g., /profile/123)
  const { profileId } = useParams();
  const navigate = useNavigate();

  // --- Hook Initialization ---
  const { userData: loggedInUser, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();
  
  const likesHook = useLikes();
  const { likedListingIds, likingInProgress, isLoadingLikes, likeError, handleLikeToggle, refetchLikes } = likesHook;
  
  const { openModal, handleNotificationClick, ModalComponent } = usePageLogic(loggedInUser, likesHook);

  // --- Local State Management ---
  // Stores data of the user being VIEWED (which might differ from loggedInUser)
  const [profileUser, setProfileUser] = useState(null); 
  const [originalListings, setOriginalListings] = useState([]); 
  const [userReviews, setUserReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('listings');
  
  // Loading and Error states for page-specific data fetching
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [pageDataError, setPageDataError] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Search functionality for the listings array
  const { searchQuery, handleSearch, filteredListings: displayedListings } = useSearch(
    originalListings,
    ['title', 'description']
  );

  /**
   * Determines if the profile being viewed belongs to the currently logged-in user.
   * It is "My Profile" if:
   * 1. No profileId is in the URL (default route /profile), OR
   * 2. The profileId in URL matches the logged-in user's ID.
   */
  const isMyProfile = !profileId || (loggedInUser && profileUser && String(loggedInUser.userId) === String(profileUser.userId));

  /**
   * Asynchronously fetches all necessary data for the profile page.
   * This includes the user's details, their listings, and their reviews.
   */
  const fetchProfileData = useCallback(async (targetId) => {
    setIsLoadingPageData(true);
    setPageDataError(null);
    try {
      // 1. Determine how to fetch the user details
      let userPromise;
      if (profileId) {
          // If viewing a public profile, use the fallback fetcher or API service
          userPromise = fetchUserById(profileId); 
      } else {
          // If viewing my own profile, use the endpoint for "me"
          userPromise = getCurrentUser();
      }

      // 2. Fetch Listings and Reviews using the target ID
      const listingsPromise = getUserListings(targetId);
      const reviewsPromise = getUserReviews(targetId);
      
      // 3. Wait for all requests to complete
      const [userResponse, listingsResponse, reviewsResponse] = await Promise.all([
        userPromise,
        listingsPromise,
        reviewsPromise
      ]);

      setProfileUser(userResponse.data);
      // --- SORTING: Available First, Sold Last (Both Newest First) ---
      const rawListings = listingsResponse.data || [];
      const sortedListings = rawListings.sort((a, b) => {
          // 1. Status Check: "Sold" goes to bottom
          const isSoldA = a.status?.toLowerCase() === 'sold';
          const isSoldB = b.status?.toLowerCase() === 'sold';

          if (isSoldA && !isSoldB) return 1;  // A is sold, B is not -> A goes after B
          if (!isSoldA && isSoldB) return -1; // A is not sold, B is sold -> A goes before B
          
          // 2. Date Check: Newest first (Secondary sort)
          return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setOriginalListings(listingsResponse.data || []);
      setUserReviews(reviewsResponse.data || []);

      // If viewing "My Profile", ensure the likes state is synced
      if (!profileId || (loggedInUser && profileId === String(loggedInUser.userId))) {
          refetchLikes();
      }

    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      setPageDataError(err.message || "Could not load profile data.");
    } finally {
      setIsLoadingPageData(false);
    }
  }, [profileId, loggedInUser, refetchLikes]); 


  /**
   * Effect: Trigger data fetching when the component mounts or IDs change.
   * Priorities:
   * 1. If profileId exists in URL, fetch that ID immediately.
   * 2. If no profileId, wait for loggedInUser to be ready, then fetch their ID.
   */
  useEffect(() => {
    if (profileId) {
        fetchProfileData(profileId);
    } else if (loggedInUser) {
        fetchProfileData(loggedInUser.userId);
    }
  }, [profileId, loggedInUser, fetchProfileData]);


  // --- Event Handlers ---

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  // Retry logic for any failed network requests on the page
  const handleRetry = () => {
    if (authError) retryAuth();
    const idToFetch = profileId || loggedInUser?.userId;
    if (pageDataError && idToFetch) fetchProfileData(idToFetch);
    if (likeError) refetchLikes();
  };
  
  // Logic to copy the profile URL to clipboard or use native share
  const handleShareProfile = () => {
    const id = profileUser?.userId;
    const url = `${window.location.origin}/profile/${id}`;
    const name = profileUser?.fullName || 'User';

    if (navigator.share) {
      navigator.share({ title: `Edu-Rent: ${name}`, text: `Check out ${name}'s profile!`, url: url })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url)
        .then(() => alert('Profile link copied!'))
        .catch(() => alert('Failed to copy link.'));
    }
  };

  // Placeholder for future messaging functionality
  const handleChatClick = () => {
      console.log("Navigating to chat with", profileUser?.fullName);
      navigate('/messages'); 
  };

  // Calculate average rating (to one decimal place)
  const averageRating = userReviews.length > 0
    ? (userReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / userReviews.length).toFixed(1)
    : 0;

  // Combine loading/error states for clean UI rendering
  const isPageLoading = isLoadingAuth || isLoadingPageData || isLoadingLikes;
  const pageError = authError || pageDataError || likeError;
  
  // --- Render: Loading State ---
  if (isPageLoading) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={logout} />
        <ProfileSkeleton />
      </div>
    );
  }

  // --- Render: Error State ---
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

  // --- Render: User Not Found State ---
  if (!profileUser) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={logout} />
        <main className="dashboard-body">
          <div className="empty-state">
             <div className="empty-state-title">User Not Found</div>
             <Link to="/dashboard" className="empty-state-action">Back to Dashboard</Link>
          </div>
        </main>
      </div>
    );
  }

  const joinedDate = profileUser.createdAt 
    ? new Date(profileUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) 
    : 'N/A';

  return (
    <div className="profile-page">
      <Header
        userName={userName}
        profilePictureUrl={loggedInUser?.profilePictureUrl}
        onLogout={logout}
        onNotificationClick={handleNotificationClick}
      />

      <main className="dashboard-body">
        
        {/* --- Profile Header Section --- */}
        <section className="content-card profile-card">
          <div className="profile-card-left">
             <img 
               src={profileUser.profilePictureUrl ? `http://localhost:8080${profileUser.profilePictureUrl}` : defaultAvatar} 
               alt={`${profileUser.fullName}'s profile`} 
               className="profile-picture"
               onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
             />
          </div>
          <div className="profile-card-center"> 
             <h1 className="profile-name">{profileUser.fullName}</h1> 
             <button onClick={openProfileModal} className="profile-details-link"> Profile Details &gt; </button> 
          </div>
          <div className="profile-card-right"> 
             <div className="profile-card-rating"><span>⭐</span><span>{averageRating}</span></div> 
             <div className="profile-card-reviews">{userReviews.length} reviews</div> 
             <div className="profile-card-joined"><span>Joined </span><span>{joinedDate}</span></div> 
             
             <div className="profile-card-actions"> 
               {/* Conditional Rendering: Edit (if owner) vs Message (if visitor) */}
               {isMyProfile ? (
                 <button className="btn btn-small btn-primary" onClick={() => navigate('/settings/profile')}> Edit Profile </button> 
               ) : (
                 <button className="btn btn-small btn-primary" onClick={handleChatClick}> Message </button> 
               )}
               <button className="icon-button" onClick={handleShareProfile} title="Share profile"> <img src={ShareIcon} alt="Share"/> </button> 
             </div> 
          </div>
        </section>

        {/* --- Content Tabs: Listings & Reviews --- */}
        <section className="content-card">
          <div className="profile-tabs">
            <button className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
              Listings ({displayedListings.length})
            </button>
            <button className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
              Reviews ({userReviews.length})
            </button>
          </div>

          <div>
            {/* Listings Tab Content */}
            {activeTab === 'listings' && (
              <div className="profile-listings-section">
                <div className="profile-listings-header">
                  <h2 className="profile-listings-title">{isMyProfile ? 'Your' : `${profileUser.fullName}'s`} Listings</h2>
                  <div className="profile-listings-actions">
                    <input
                      type="text"
                      placeholder="Search listings..."
                      className="profile-search-input"
                      value={searchQuery}
                      onChange={handleSearch}
                    />
                    {/* Only show Manage Listings button if viewing own profile */}
                    {isMyProfile && (
                        <button className="btn btn-small btn-primary-accent" onClick={() => navigate('/manage-listings')}>
                          Manage Listings
                        </button>
                    )}
                  </div>
                </div>
                
                {displayedListings.length > 0 ? (
                  <div className="listing-grid">
                    {displayedListings.map((listing) => (
                      <ListingCard
                        key={listing.listingId}
                        listing={listing}
                        onClick={openModal}
                        currentUserId={loggedInUser?.userId} 
                        
                        // Logic: 
                        // 1. If it's My Profile, isLiked is forced false (owner can't like own items)
                        // 2. If Public Profile, check likedListingIds Set.
                        isLiked={isMyProfile ? false : likedListingIds.has(listing.listingId)}
                        
                        // Logic: Disable click handler if owner, enable if visitor
                        onLikeClick={isMyProfile ? () => {} : handleLikeToggle}
                        
                        isLiking={isMyProfile ? false : likingInProgress.has(listing.listingId)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                     <div className="empty-state-icon">📦</div> 
                     <div className="empty-state-title">{searchQuery ? 'No Listings Found' : 'No Listings Yet'}</div>
                     {!searchQuery && isMyProfile && (
                         <button className="empty-state-action" onClick={() => navigate('/list-item')}> Create Listing </button>
                     )}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab Content */}
            {activeTab === 'reviews' && (
              <div className="profile-reviews-section">
                  <h2 className="profile-listings-title" style={{ marginBottom: '1.5rem' }}>Reviews</h2>
                  {userReviews.length > 0 ? (
                     userReviews.map((review) => <ReviewCard key={review.reviewId} review={review} />)
                  ) : (
                     <div className="empty-state"><div className="empty-state-title">No Reviews Yet</div></div>
                  )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      {isProfileModalOpen && <ProfileDetailsModal user={profileUser} onClose={closeProfileModal} />}
      <ModalComponent />

    </div>
  );
}
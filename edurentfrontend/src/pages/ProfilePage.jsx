import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios'; 

// Custom hooks for application logic
import useAuth from '../hooks/useAuth';
import useLikes from '../hooks/useLikes';
import usePageLogic from '../hooks/usePageLogic';
import useSearch from '../hooks/useSearch';

// UI Components
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import ReviewImagesModal from '../components/ReviewImagesModal';
import ReviewModal from '../components/ReviewModal'; // Used for editing existing reviews

// API Services
import { 
  getUserListings, 
  getUserReviews, 
  getCurrentUser, 
  deleteReview 
} from '../services/apiService';

// Styles and Assets
import '../static/ProfilePage.css';
import '../static/DashboardPage.css';
import ShareIcon from '../assets/share.png';
import defaultAvatar from '../assets/default-avatar.png';

const API_URL = 'http://localhost:8080/api/v1';

// SVG Placeholder for items without images
const defaultProductPlaceholder = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3e%3crect width='60' height='60' fill='%23f0f0f0'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' fill='%23aaaaaa'%3eItem%3c/text%3e%3c/svg%3e";

// Helper function to ensure image paths are absolute URLs
const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `http://localhost:8080${path}`;
};

// Fallback to manually fetch user data by ID if the service function is unavailable
const fetchUserById = async (id) => {
  const storedData = localStorage.getItem('eduRentUserData');
  const token = storedData ? JSON.parse(storedData).token : null;
  
  return axios.get(`${API_URL}/users/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
};

// Loading state component displaying a skeleton layout
function ProfileSkeleton() {
  return (
    <main className="dashboard-body">
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

// Modal component showing detailed user information
function ProfileDetailsModal({ user, onClose }) {
  if (!user) return null;

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

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

// Error component with a retry button
function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="error-container" style={{ margin: '2rem auto', maxWidth: '600px'}}>
      <div className="error-title">⚠️ Something went wrong</div>
      <div className="error-message">{error}</div>
      <button className="error-retry-btn" onClick={onRetry}>Try Again</button>
    </div>
  );
}

// Card component displaying individual review details
// Handles data extraction for images and conditional rendering of edit/delete buttons
function ReviewCard({ review, onImageClick, currentUserId, onEdit, onDelete }) {
  const reviewerName = review.reviewer?.fullName || 'Anonymous';
  const reviewerAvatar = getImageUrl(review.reviewer?.profilePictureUrl) || defaultAvatar;
   
  const listingTitle = review.listing?.title || 'Unknown Item';
   
  // Display the Product Cover Photo on the left for context
  const productCoverImage = review.listing?.imageUrl 
    ? getImageUrl(review.listing.imageUrl) 
    : defaultProductPlaceholder;

  const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A';
   
  // Extract Review Images
  // Ensure we map the array of image objects (from backend) to simple URL strings for display
  const reviewImageObjects = review.reviewImages || [];
  const reviewImageUrls = reviewImageObjects.map(img => img.url);

  // Determine if the currently logged-in user is the author of this review
  const isAuthor = currentUserId && review.reviewer?.userId === currentUserId;

  return (
    <div className="review-card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        
        {/* Left: Product Cover Photo (Always visible) */}
        <div style={{ flexShrink: 0 }}>
            <img 
              src={productCoverImage} 
              alt={listingTitle} 
              style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee' }} 
              onError={(e) => { e.target.onerror = null; e.target.src = defaultProductPlaceholder; }}
            />
        </div>

        {/* Right: Review Content */}
        <div style={{ flexGrow: 1 }}>
            
            {/* Header: Reviewer Info, Rating, and Actions */}
            <div className="review-header" style={{ marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img 
                      src={reviewerAvatar} 
                      alt="Reviewer" 
                      style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
                      onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }} 
                    />
                    <strong className="review-reviewer">{reviewerName}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>• {reviewDate}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="review-rating">
                      {'⭐'.repeat(review.rating || 0)}
                      {'☆'.repeat(5 - (review.rating || 0))}
                    </span>

                    {/* Edit and Delete Buttons (Visible only to the author) */}
                    {isAuthor && (
                        <div style={{ marginLeft: '0.5rem', display: 'flex', gap: '5px' }}>
                            <button 
                                onClick={() => onEdit(review)} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#6c757d' }} 
                                title="Edit"
                            >
                                ✏️
                            </button>
                            <button 
                                onClick={() => onDelete(review.id)} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#e53935' }} 
                                title="Delete"
                            >
                                🗑️
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Item Name */}
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
              Item: {listingTitle}
            </div>

            {/* Review Comment */}
            <p className="review-comment" style={{ marginBottom: reviewImageUrls.length > 0 ? '0.75rem' : '0' }}>
                {review.comment || 'No comment provided.'}
            </p>

            {/* Review Images Section (Displayed below the comment) */}
            {reviewImageUrls.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {reviewImageUrls.map((imgUrl, index) => (
                        <img 
                            key={index}
                            src={getImageUrl(imgUrl)}
                            alt={`Evidence ${index}`}
                            // Pass the array of URLs (converted to absolute paths) to the modal viewer
                            onClick={() => onImageClick(reviewImageUrls.map(getImageUrl), index)}
                            style={{ 
                                width: '60px', 
                                height: '60px', 
                                borderRadius: '6px', 
                                objectFit: 'cover', 
                                cursor: 'pointer',
                                border: '1px solid #ddd'
                            }}
                            onError={(e) => e.target.style.display = 'none'} 
                        />
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  
  const { profileId } = useParams();
  const navigate = useNavigate();

  // Custom hooks for application features
  const { userData: loggedInUser, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();
  const likesHook = useLikes();
  const { likedListingIds, likingInProgress, isLoadingLikes, likeError, handleLikeToggle, refetchLikes } = likesHook;
  const { openModal, handleNotificationClick, ModalComponent } = usePageLogic(loggedInUser, likesHook);

  // Local state management
  const [profileUser, setProfileUser] = useState(null); 
  const [originalListings, setOriginalListings] = useState([]); 
  const [userReviews, setUserReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('listings');
  
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [pageDataError, setPageDataError] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // State to manage the Review Image Modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0); 

  // State to manage the Edit Review Modal
  const [editingReview, setEditingReview] = useState(null);

  // Search filtering logic
  const { searchQuery, handleSearch, filteredListings: displayedListings } = useSearch(
    originalListings,
    ['title', 'description']
  );

  // Determines if we are viewing the logged-in user's own profile
  const isMyProfile = !profileId || (loggedInUser && profileUser && String(loggedInUser.userId) === String(profileUser.userId));

  // Handler to open the image modal with specific images and starting index
  const openReviewImages = (images, index = 0) => {
      setModalImages(images);
      setModalInitialIndex(index);
      setIsImageModalOpen(true);
  };

  // Handlers for deleting reviews
  const handleDeleteReview = async (reviewId) => {
      if (!window.confirm("Are you sure you want to delete this review?")) return;
      try {
          await deleteReview(reviewId);
          // Reload the page to reflect changes
          window.location.reload(); 
      } catch (error) {
          alert("Failed to delete review.");
      }
  };

  // Handlers for editing reviews
  const handleEditReview = (review) => {
      setEditingReview(review);
  };

  const handleEditSuccess = () => {
      setEditingReview(null);
      // Reload the page to reflect changes
      window.location.reload();
  };

  // Main data fetching function for the profile
  const fetchProfileData = useCallback(async (targetId) => {
    setIsLoadingPageData(true);
    setPageDataError(null);
    try {
      let userPromise;
      if (profileId) {
          userPromise = fetchUserById(profileId); 
      } else {
          userPromise = getCurrentUser();
      }

      const listingsPromise = getUserListings(targetId);
      const reviewsPromise = getUserReviews(targetId);
      
      const [userResponse, listingsResponse, reviewsResponse] = await Promise.all([
        userPromise,
        listingsPromise,
        reviewsPromise
      ]);

      setProfileUser(userResponse.data);
      
      // Sorting logic: Sold items last, then by date descending
      const rawListings = listingsResponse.data || [];
      const sortedListings = rawListings.sort((a, b) => {
          const isSoldA = a.status?.toLowerCase() === 'sold';
          const isSoldB = b.status?.toLowerCase() === 'sold';

          if (isSoldA && !isSoldB) return 1; 
          if (!isSoldA && isSoldB) return -1; 
          
          return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setOriginalListings(listingsResponse.data || []);
      setUserReviews(reviewsResponse.data || []);

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

  // Effect to trigger data fetching on mount or ID change
  useEffect(() => {
    if (profileId) {
        fetchProfileData(profileId);
    } else if (loggedInUser) {
        fetchProfileData(loggedInUser.userId);
    }
  }, [profileId, loggedInUser, fetchProfileData]);

  // Modal handlers
  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const handleRetry = () => {
    if (authError) retryAuth();
    const idToFetch = profileId || loggedInUser?.userId;
    if (pageDataError && idToFetch) fetchProfileData(idToFetch);
    if (likeError) refetchLikes();
  };
  
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

  const handleChatClick = () => {
      console.log("Navigating to chat with", profileUser?.fullName);
      navigate('/messages'); 
  };

  // Split reviews into Buyer and Seller categories
  const buyerReviews = userReviews.filter(r => r.reviewerRole === 'BUYER');
  const sellerReviews = userReviews.filter(r => r.reviewerRole === 'SELLER');

  const averageRating = userReviews.length > 0
    ? (userReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / userReviews.length).toFixed(1)
    : 0;

  const isPageLoading = isLoadingAuth || isLoadingPageData || isLoadingLikes;
  const pageError = authError || pageDataError || likeError;
  
  // Loading State
  if (isPageLoading) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={logout} />
        <ProfileSkeleton />
      </div>
    );
  }

  // Error State
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

  // Not Found State
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
        
        {/* Profile Header Section */}
        <section className="content-card profile-card">
          <div className="profile-card-left">
             <img 
               src={
                 profileUser.profilePictureUrl 
                   ? (profileUser.profilePictureUrl.startsWith('http') ? profileUser.profilePictureUrl : `http://localhost:8080${profileUser.profilePictureUrl}`)
                   : defaultAvatar
               }
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
               {isMyProfile ? (
                 <button className="btn btn-small btn-primary" onClick={() => navigate('/settings/profile')}> Edit Profile </button> 
               ) : (
                 <button className="btn btn-small btn-primary" onClick={handleChatClick}> Message </button> 
               )}
               <button className="icon-button" onClick={handleShareProfile} title="Share profile"> <img src={ShareIcon} alt="Share"/> </button> 
             </div> 
          </div>
        </section>

        {/* Tabs for Listings and Reviews */}
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
            {/* Listings Tab */}
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
                        isLiked={isMyProfile ? false : likedListingIds.has(listing.listingId)}
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

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="profile-reviews-section">
                  
                  {/* Reviews from Buyers Section */}
                  <h3 className="profile-listings-title" style={{ marginTop: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                    Reviews from Buyers
                  </h3>
                  {buyerReviews.length > 0 ? (
                      buyerReviews.map((review) => (
                        <ReviewCard 
                           key={review.id || review.reviewId} 
                           review={review} 
                           onImageClick={openReviewImages}
                           currentUserId={loggedInUser?.userId} // Pass user ID to check authorship
                           onEdit={handleEditReview}            // Pass handler
                           onDelete={handleDeleteReview}        // Pass handler
                        />
                      ))
                  ) : (
                      <p className="text-muted" style={{ fontStyle: 'italic', marginBottom: '2rem' }}>No reviews from buyers yet.</p>
                  )}

                  <hr style={{ margin: '2rem 0', borderColor: 'var(--border-color)' }} />

                  {/* Reviews from Sellers Section */}
                  <h3 className="profile-listings-title" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                    Reviews from Sellers
                  </h3>
                  {sellerReviews.length > 0 ? (
                      sellerReviews.map((review) => (
                        <ReviewCard 
                           key={review.id || review.reviewId} 
                           review={review}
                           onImageClick={openReviewImages}
                           currentUserId={loggedInUser?.userId} // Pass user ID to check authorship
                           onEdit={handleEditReview}            // Pass handler
                           onDelete={handleDeleteReview}        // Pass handler
                        />
                      ))
                  ) : (
                      <p className="text-muted" style={{ fontStyle: 'italic' }}>No reviews from sellers yet.</p>
                  )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* User Details Modal */}
      {isProfileModalOpen && <ProfileDetailsModal user={profileUser} onClose={closeProfileModal} />}
      
      {/* Product Details Modal */}
      <ModalComponent />

      {/* Review Images Viewer Modal */}
      {isImageModalOpen && (
          <ReviewImagesModal 
              images={modalImages} 
              initialIndex={modalInitialIndex}
              onClose={() => setIsImageModalOpen(false)} 
          />
      )}

      {/* Edit Review Modal */}
      {editingReview && (
          <ReviewModal 
              initialReview={editingReview} 
              onClose={() => setEditingReview(null)}
              onSuccess={handleEditSuccess}
              // Fallback props required by propTypes (not used in edit mode)
              transactionId={null} 
              reviewerId={null}
              otherUserName="User"
          />
      )}

    </div>
  );
}
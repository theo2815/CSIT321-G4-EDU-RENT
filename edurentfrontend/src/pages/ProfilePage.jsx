import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios'; 

// Custom hooks for application logic
import useAuth from '../hooks/useAuth';
import useLikes from '../hooks/useLikes';
import usePageLogic from '../hooks/usePageLogic';
import useSearch from '../hooks/useSearch';

// New Feedback Hooks
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmationContext';

// UI Components
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import ReviewImagesModal from '../components/ReviewImagesModal';
import ReviewModal from '../components/ReviewModal';
import ConversationStarterModal from '../components/ConversationStarterModal';
import LoadMoreButton from '../components/LoadMoreButton';

// API Services
import { 
  getUserListings, 
  getUserReviews, 
  getCurrentUser, 
  deleteReview,
  getReviewsFromBuyers,  // API to fetch reviews where user is the seller
  getReviewsFromSellers  // API to fetch reviews where user is the buyer
} from '../services/apiService';

// Styles and Assets
import '../static/ProfilePage.css';
import '../static/DashboardPage.css';
import ShareIcon from '../assets/share.png';
import defaultAvatar from '../assets/default-avatar.png';

const API_URL = 'http://localhost:8080/api/v1';

// Fallback for missing item images
const defaultProductPlaceholder = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3e%3crect width='60' height='60' fill='%23f0f0f0'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' fill='%23aaaaaa'%3eItem%3c/text%3e%3c/svg%3e";

// Ensure image paths are absolute
const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `http://localhost:8080${path}`;
};

// Fallback fetcher if the service layer fails
const fetchUserById = async (id) => {
  const storedData = localStorage.getItem('eduRentUserData');
  const token = storedData ? JSON.parse(storedData).token : null;
  
  return axios.get(`${API_URL}/users/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
};

// Helper: Calculate Average Rating
const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
  return (sum / reviews.length).toFixed(1);
};

// Loading state layout
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

// Modal for extra user details
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

function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="error-container" style={{ margin: '2rem auto', maxWidth: '600px'}}>
      <div className="error-title">⚠️ Something went wrong</div>
      <div className="error-message">{error}</div>
      <button className="error-retry-btn" onClick={onRetry}>Try Again</button>
    </div>
  );
}

// Single review item
function ReviewCard({ review, onImageClick, currentUserId, onEdit, onDelete }) {
  const reviewerName = review.reviewer?.fullName || 'Anonymous';
  const reviewerAvatar = getImageUrl(review.reviewer?.profilePictureUrl) || defaultAvatar;
  const reviewerId = review.reviewer?.userId;
    
  const listingTitle = review.listing?.title || 'Unknown Item';
    
  const productCoverImage = review.listing?.imageUrl 
    ? getImageUrl(review.listing.imageUrl) 
    : defaultProductPlaceholder;

  const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A';
    
  const reviewImageObjects = review.reviewImages || [];
  const reviewImageUrls = reviewImageObjects.map(img => img.url);

  const isAuthor = currentUserId && review.reviewer?.userId === currentUserId;

  return (
    <div className="review-card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        
        {/* Product Thumbnail */}
        <div style={{ flexShrink: 0 }}>
            <img 
              src={productCoverImage} 
              alt={listingTitle} 
              style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee' }} 
              onError={(e) => { e.target.onerror = null; e.target.src = defaultProductPlaceholder; }}
            />
        </div>

        {/* Review Body */}
        <div style={{ flexGrow: 1 }}>
            
            <div className="review-header" style={{ marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img 
                      src={reviewerAvatar} 
                      alt="Reviewer" 
                      style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
                      onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }} 
                    />
                    <Link 
                      to={reviewerId ? `/profile/${reviewerId}` : '#'}
                      className="review-reviewer"
                      style={{ 
                          color: 'var(--primary-color)', 
                          textDecoration: 'none',
                          fontWeight: '700', 
                          cursor: reviewerId ? 'pointer' : 'default'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      onClick={(e) => !reviewerId && e.preventDefault()} 
                    >
                        {reviewerName}
                    </Link>

                    <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>• {reviewDate}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="review-rating">
                      {'⭐'.repeat(review.rating || 0)}
                      {'☆'.repeat(5 - (review.rating || 0))}
                    </span>

                    {/* Actions for Author */}
                    {isAuthor && (
                        <div style={{ marginLeft: '0.5rem', display: 'flex', gap: '5px' }}>
                            <button 
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    onEdit(review); 
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#6c757d' }} 
                                title="Edit"
                            >
                                ✏️
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault(); 
                                    onDelete(review.id);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#e53935' }} 
                                title="Delete"
                            >
                                🗑️
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
              Item: {listingTitle}
            </div>

            <p className="review-comment" style={{ marginBottom: reviewImageUrls.length > 0 ? '0.75rem' : '0' }}>
                {review.comment || 'No comment provided.'}
            </p>

            {/* Attached Images */}
            {reviewImageUrls.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {reviewImageUrls.map((imgUrl, index) => (
                        <img 
                            key={index}
                            src={getImageUrl(imgUrl)}
                            alt={`Evidence ${index}`}
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
  const location = useLocation();

  // Auth and global logic
  const { userData: loggedInUser, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();
  const likesHook = useLikes();
  const { likedListingIds, likingInProgress, isLoadingLikes, likeError, handleLikeToggle, refetchLikes } = likesHook;
  const { openModal, handleNotificationClick, ModalComponent } = usePageLogic(loggedInUser, likesHook);

  // Initialize feedback tools
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();

  // Local Data State
  const [profileUser, setProfileUser] = useState(null); 
  const [originalListings, setOriginalListings] = useState([]); 
  
  // Split Review State: Separates reviews received as Seller from reviews received as Buyer
  const [buyerReviews, setBuyerReviews] = useState([]); // Reviews from Buyers (User is Seller)
  const [sellerReviews, setSellerReviews] = useState([]); // Reviews from Sellers (User is Buyer)
  
  // Track total counts from server for accurate summary
  const [totalBuyerReviewsCount, setTotalBuyerReviewsCount] = useState(0);
  const [totalSellerReviewsCount, setTotalSellerReviewsCount] = useState(0);

  // Review Filter State
  const [reviewFilter, setReviewFilter] = useState('all'); 

  // Listing Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Review Pagination States
  const [buyerPage, setBuyerPage] = useState(0);
  const [hasMoreBuyerReviews, setHasMoreBuyerReviews] = useState(false);
  const [isLoadingBuyerReviews, setIsLoadingBuyerReviews] = useState(false);

  const [sellerPage, setSellerPage] = useState(0);
  const [hasMoreSellerReviews, setHasMoreSellerReviews] = useState(false);
  const [isLoadingSellerReviews, setIsLoadingSellerReviews] = useState(false);
  
  // Controls
  const [activeTab, setActiveTab] = useState('listings');
  const [listingFilter, setListingFilter] = useState('all'); 
  
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [pageDataError, setPageDataError] = useState(null);

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0); 
  const [editingReview, setEditingReview] = useState(null);
  const [isStarterModalOpen, setIsStarterModalOpen] = useState(false);

  // --- Data Fetching ---

  // Fetches reviews where this user was the Seller (received from Buyers)
  const fetchBuyerReviews = useCallback(async (targetId, page = 0) => {
      setIsLoadingBuyerReviews(true);
      try {
          const res = await getReviewsFromBuyers(targetId, page, 5); // Fetch 5 at a time
          const data = res.data;
          
          // If page 0, replace list. If > 0, append.
          setBuyerReviews(prev => page === 0 ? data.content : [...prev, ...data.content]);
          setBuyerPage(data.number);
          setHasMoreBuyerReviews(data.number < data.totalPages - 1);
          setTotalBuyerReviewsCount(data.totalElements || 0); // Capture total count
      } catch (err) {
          console.error("Failed to load buyer reviews", err);
      } finally {
          setIsLoadingBuyerReviews(false);
      }
  }, []);

  // Fetches reviews where this user was the Buyer (received from Sellers)
  const fetchSellerReviews = useCallback(async (targetId, page = 0) => {
      setIsLoadingSellerReviews(true);
      try {
          const res = await getReviewsFromSellers(targetId, page, 5); // Fetch 5 at a time
          const data = res.data;
          setSellerReviews(prev => page === 0 ? data.content : [...prev, ...data.content]);
          setSellerPage(data.number);
          setHasMoreSellerReviews(data.number < data.totalPages - 1);
          setTotalSellerReviewsCount(data.totalElements || 0); // Capture total count
      } catch (err) {
          console.error("Failed to load seller reviews", err);
      } finally {
          setIsLoadingSellerReviews(false);
      }
  }, []);
  
  // Fetches main profile data; triggers separate review fetches on initial load
  const fetchProfileData = useCallback(async (targetId, page = 0) => {
    setIsLoadingPageData(true);
    setPageDataError(null);
    try {
      // 1. Fetch User Data (Only needed on first load)
      if (page === 0) {
        let userPromise;
        if (profileId) {
            userPromise = fetchUserById(profileId); 
        } else {
            userPromise = getCurrentUser();
        }
        const userResponse = await userPromise;
        setProfileUser(userResponse.data);

        // Initiate the review fetches for the first page
        fetchBuyerReviews(targetId, 0);
        fetchSellerReviews(targetId, 0);
      }

      // 2. Fetch Listings for the requested page
      const listingsPromise = getUserListings(targetId, page, 8); // Fetch 8 items at a time
      const listingsResponse = await listingsPromise;
      
      const listingsData = listingsResponse.data;
      const newContent = listingsData.content || [];

      // Handle listing pagination state
      setOriginalListings(prev => {
          const combined = page === 0 ? newContent : [...prev, ...newContent];
          
          // Sort: Sold items last, then Newest first
          return combined.sort((a, b) => {
            const isSoldA = a.status?.toLowerCase() === 'sold';
            const isSoldB = b.status?.toLowerCase() === 'sold';

            if (isSoldA && !isSoldB) return 1; 
            if (!isSoldA && isSoldB) return -1; 
            
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
      });

      setCurrentPage(listingsData.number);
      setHasMore(listingsData.number < listingsData.totalPages - 1);

      refetchLikes();

    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      setPageDataError(err.message || "Could not load profile data.");
    } finally {
      setIsLoadingPageData(false);
    }
  }, [profileId, refetchLikes, fetchBuyerReviews, fetchSellerReviews]); 

  // Resets all data to page 0
  const refreshData = useCallback(() => {
    const idToFetch = profileId || loggedInUser?.userId;
    if (idToFetch) {
        fetchProfileData(idToFetch, 0);
    }
  }, [profileId, loggedInUser, fetchProfileData]);

  // Handler for Load More Listings
  const handleLoadMoreListings = () => {
    const idToFetch = profileId || loggedInUser?.userId;
    if (idToFetch) {
        fetchProfileData(idToFetch, currentPage + 1);
    }
  };

  const handleRefreshReviews = () => {
    const id = profileUser?.userId;
    if (id) {
        fetchBuyerReviews(id, 0);
        fetchSellerReviews(id, 0);
    }
  };

  // --- Filtering Logic ---

  // Sub-tabs filtering (Rent, Sale, Sold)
  const typeFilteredListings = useMemo(() => {
    return originalListings.filter(item => {
      const status = item.status?.toLowerCase() || 'available';
      const type = item.listingType?.toLowerCase() || '';

      switch (listingFilter) {
        case 'sold': return status === 'sold';
        case 'rent': return status !== 'sold' && type.includes('rent');
        case 'sale': return status !== 'sold' && type.includes('sale');
        case 'all': default: return status !== 'sold';
      }
    });
  }, [originalListings, listingFilter]);

  // Search logic applied to filtered results
  const { searchQuery, handleSearch, filteredListings: displayedListings } = useSearch(
    typeFilteredListings,
    ['title', 'description']
  );

  const isMyProfile = !profileId || (loggedInUser && profileUser && String(loggedInUser.userId) === String(profileUser.userId));

  // --- Handlers ---

  const openReviewImages = (images, index = 0) => {
      setModalImages(images);
      setModalInitialIndex(index);
      setIsImageModalOpen(true);
  };

  const handleDeleteReview = async (reviewId) => {
      const isConfirmed = await confirm({
          title: "Delete Review?",
          message: "Are you sure you want to delete this review? This action cannot be undone.",
          confirmText: "Yes, Delete",
          isDangerous: true
      });

      if (isConfirmed) {
          try {
              await deleteReview(reviewId);
              showSuccess("Review deleted successfully.");
              handleRefreshReviews();
          } catch (error) {
              console.error("Delete review failed:", error);
              showError("Failed to delete review.");
          }
      }
  };

  const handleEditReview = (review) => {
      setEditingReview(review);
  };

  const handleEditSuccess = () => {
      setEditingReview(null);
      // Refresh the reviews after editing
      handleRefreshReviews();
  };

  // Initial Data Load
  useEffect(() => {
    if (profileId) {
        fetchProfileData(profileId, 0);
    } else if (loggedInUser) {
        fetchProfileData(loggedInUser.userId, 0);
    }
  }, [profileId, loggedInUser?.userId, fetchProfileData]);

  // Handle Tab Navigation via URL (e.g., from Notifications)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'reviews') {
        setActiveTab('reviews');
        // Optional: Scroll to reviews section
        setTimeout(() => {
            const reviewSection = document.querySelector('.profile-reviews-section');
            if (reviewSection) reviewSection.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }
  }, [location.search]);

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const handleRetry = () => {
    if (authError) retryAuth();
    refreshData();
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
        .then(() => showSuccess('Profile link copied to clipboard!'))
        .catch(() => showError('Failed to copy link.'));
    }
  };

  const handleChatClick = () => {
      setIsStarterModalOpen(true);
  };

  const handleStarterListingSelect = (listing) => {
      openModal(listing);
  };

  // --- Derived State for UI ---
  const totalReviewsDisplay = totalBuyerReviewsCount + totalSellerReviewsCount;
  const allLoadedReviews = [...buyerReviews, ...sellerReviews]; // For average calculation based on what we see
  const overallRating = calculateAverageRating(allLoadedReviews);

  const isPageLoading = isLoadingAuth || (isLoadingPageData && currentPage === 0) || isLoadingLikes;
  const pageError = authError || pageDataError || likeError;
  
  // --- Render Helpers ---

  const renderReviewSummary = () => (
    <div className="review-summary-container" style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50', lineHeight: 1 }}>{overallRating}</div>
        <div style={{ color: '#f1c40f', fontSize: '1.2rem', margin: '0.25rem 0' }}>
           {'⭐'.repeat(Math.round(overallRating))}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Overall Rating</div>
      </div>
      <div style={{ height: '50px', width: '1px', background: '#ddd' }}></div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2c3e50' }}>{totalReviewsDisplay}</div>
        <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Total Reviews</div>
      </div>
    </div>
  );

  const renderReviewFilters = () => (
    <div className="profile-sub-tabs" style={{ marginBottom: '1.5rem' }}>
      <button 
        className={`sub-tab-btn ${reviewFilter === 'all' ? 'active' : ''}`} 
        onClick={() => setReviewFilter('all')}
      >
        All
      </button>
      <button 
        className={`sub-tab-btn ${reviewFilter === 'buyers' ? 'active' : ''}`} 
        onClick={() => setReviewFilter('buyers')}
      >
        From Buyers ({totalBuyerReviewsCount})
      </button>
      <button 
        className={`sub-tab-btn ${reviewFilter === 'sellers' ? 'active' : ''}`} 
        onClick={() => setReviewFilter('sellers')}
      >
        From Sellers ({totalSellerReviewsCount})
      </button>
    </div>
  );

  const renderReviewList = (reviews, title, loadMoreFn, isLoadingMore, hasMore) => (
    <div className="review-list-section" style={{ marginBottom: '2rem' }}>
      {title && <h3 className="profile-listings-title" style={{ fontSize: '1.1rem' }}>{title}</h3>}
      
      {reviews.length > 0 ? (
        <>
          <div className="reviews-list">
            {reviews.map(review => (
                <ReviewCard 
                    key={review.id || review.reviewId} 
                    review={review}
                    onImageClick={openReviewImages}
                    currentUserId={loggedInUser?.userId}
                    onEdit={handleEditReview}
                    onDelete={() => handleDeleteReview(review.id)}
                />
            ))}
          </div>
          <LoadMoreButton onLoadMore={loadMoreFn} isLoading={isLoadingMore} hasMore={hasMore} />
        </>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '0.5rem' }}>No reviews found.</p>
      )}
    </div>
  );

  // --- Main Render ---
  
  if (isPageLoading) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={logout} />
        <ProfileSkeleton />
      </div>
    );
  }

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
        
        {/* Profile Info Card */}
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
             <div className="profile-card-rating"><span>⭐</span><span>{overallRating}</span></div> 
             <div className="profile-card-reviews">{totalReviewsDisplay} Reviews</div> 
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

        {/* Tabs Section */}
        <section className="content-card">
          <div className="profile-tabs">
            <button className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
              Listings ({displayedListings.length})
            </button>
            <button className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
              Reviews
            </button>
          </div>

          <div>
            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="profile-listings-section">
                <div className="profile-listings-header">
                  <h2 className="profile-listings-title">{isMyProfile ? 'Your' : `${profileUser.fullName}'s`} Listings</h2>
                  
                  {/* Filter Sub-tabs */}
                  <div className="profile-sub-tabs">
                    <button 
                      className={`sub-tab-btn ${listingFilter === 'all' ? 'active' : ''}`} 
                      onClick={() => setListingFilter('all')}
                    >
                      All
                    </button>
                    <button 
                      className={`sub-tab-btn ${listingFilter === 'rent' ? 'active' : ''}`} 
                      onClick={() => setListingFilter('rent')}
                    >
                      For Rent
                    </button>
                    <button 
                      className={`sub-tab-btn ${listingFilter === 'sale' ? 'active' : ''}`} 
                      onClick={() => setListingFilter('sale')}
                    >
                      For Sale
                    </button>
                    <button 
                      className={`sub-tab-btn ${listingFilter === 'sold' ? 'active' : ''}`} 
                      onClick={() => setListingFilter('sold')}
                    >
                      Sold
                    </button>
                  </div>

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
                  <>
                    <div className="listing-grid">
                      {displayedListings.map((listing) => (
                        <ListingCard
                          key={listing.listingId}
                          listing={listing}
                          onClick={openModal}
                          currentUserId={loggedInUser?.userId} 
                          isLiked={isMyProfile ? false : likedListingIds.has(listing.listingId)}
                          onLikeClick={isMyProfile || listing.status === 'Sold' ? () => {} : handleLikeToggle}
                          isLiking={isMyProfile ? false : likingInProgress.has(listing.listingId)}
                        />
                      ))}
                    </div>
                    <LoadMoreButton onLoadMore={handleLoadMoreListings} isLoading={isLoadingPageData} hasMore={hasMore} />
                  </>
                ) : (
                  <div className="empty-state">
                      <div className="empty-state-icon">📦</div> 
                      <div className="empty-state-title">
                        {listingFilter === 'sold' ? 'No Sold Items' : 'No Listings Found'}
                      </div>
                      <p style={{ color: 'var(--text-muted)' }}>
                        {searchQuery ? `No results for "${searchQuery}" in this tab.` : 'This list is empty.'}
                      </p>
                      {!searchQuery && isMyProfile && listingFilter !== 'sold' && (
                          <button className="empty-state-action" onClick={() => navigate('/list-item')}> Create Listing </button>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab (Updated UI) */}
            {activeTab === 'reviews' && (
              <div className="profile-reviews-section">
                
                {renderReviewSummary()}
                {renderReviewFilters()}

                {/* View: ALL */}
                {reviewFilter === 'all' && (
                  <>
                    {renderReviewList(
                        buyerReviews, 
                        "Reviews from Buyers (Your sold items)", 
                        () => fetchBuyerReviews(profileUser.userId, buyerPage + 1),
                        isLoadingBuyerReviews,
                        hasMoreBuyerReviews
                    )}
                    
                    {/* Only show separator if both sections have content */}
                    {buyerReviews.length > 0 && sellerReviews.length > 0 && (
                        <hr style={{ margin: '2rem 0', borderTop: '1px solid #eee' }} />
                    )}

                    {renderReviewList(
                        sellerReviews, 
                        "Reviews from Sellers (Your bought items)", 
                        () => fetchSellerReviews(profileUser.userId, sellerPage + 1),
                        isLoadingSellerReviews,
                        hasMoreSellerReviews
                    )}
                  </>
                )}

                {/* View: BUYERS Only */}
                {reviewFilter === 'buyers' && (
                    renderReviewList(
                        buyerReviews, 
                        "Reviews from Buyers", 
                        () => fetchBuyerReviews(profileUser.userId, buyerPage + 1),
                        isLoadingBuyerReviews,
                        hasMoreBuyerReviews
                    )
                )}

                {/* View: SELLERS Only */}
                {reviewFilter === 'sellers' && (
                    renderReviewList(
                        sellerReviews, 
                        "Reviews from Sellers", 
                        () => fetchSellerReviews(profileUser.userId, sellerPage + 1),
                        isLoadingSellerReviews,
                        hasMoreSellerReviews
                    )
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* --- Modals --- */}

      {/* Conversation Starter */}
      <ConversationStarterModal 
        isOpen={isStarterModalOpen}
        onClose={() => setIsStarterModalOpen(false)}
        listings={originalListings.filter(l => l.status !== 'Sold' && l.status !== 'Inactive')} 
        onListingSelect={handleStarterListingSelect}
        currentUserId={loggedInUser?.userId}
        likedListingIds={likedListingIds}
        likingInProgress={likingInProgress}
        onLikeToggle={handleLikeToggle}
      />

      {/* User Details */}
      {isProfileModalOpen && <ProfileDetailsModal user={profileUser} onClose={closeProfileModal} />}
      
      {/* Product Details */}
      <ModalComponent />

      {/* Review Images Viewer */}
      {isImageModalOpen && (
          <ReviewImagesModal 
              images={modalImages} 
              initialIndex={modalInitialIndex}
              onClose={() => setIsImageModalOpen(false)} 
          />
      )}

      {/* Edit Review Form */}
      {editingReview && (
          <ReviewModal 
              initialReview={editingReview} 
              onClose={() => setEditingReview(null)}
              onSuccess={handleEditSuccess}
              transactionId={null} 
              reviewerId={null}
              otherUserName="User"
          />
      )}

    </div>
  );
}
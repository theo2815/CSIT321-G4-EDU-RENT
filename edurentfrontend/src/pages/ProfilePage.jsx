import React, { useState, useEffect, useCallback } from 'react';
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
            {user.bio && user.bio.trim() && (
              <li><strong>Bio:</strong> {user.bio}</li>
            )}
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

  // usePageLogic moved down to access originalListings

  // Initialize feedback tools
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();

  // Local Data State
  const [profileUser, setProfileUser] = useState(null); 
  
  // Controls
  const [activeTab, setActiveTab] = useState('listings');
  const [listingFilter, setListingFilter] = useState('all'); 
  
  // independent tab state
  const [tabData, setTabData] = useState({
      all: { listings: [], page: 0, hasMore: true, initialized: false, totalElements: 0 },
      rent: { listings: [], page: 0, hasMore: true, initialized: false, totalElements: 0 },
      sale: { listings: [], page: 0, hasMore: true, initialized: false, totalElements: 0 },
      sold: { listings: [], page: 0, hasMore: true, initialized: false, totalElements: 0 }
  }); 

  const { openModal, handleNotificationClick, ModalComponent } = usePageLogic(loggedInUser, likesHook, tabData[listingFilter]?.listings || []); 
  
  // Split Review State: Separates reviews received as Seller from reviews received as Buyer
  const [buyerReviews, setBuyerReviews] = useState([]); // Reviews from Buyers (User is Seller)
  const [sellerReviews, setSellerReviews] = useState([]); // Reviews from Sellers (User is Buyer)
  
  // Track total counts from server for accurate summary
  const [totalBuyerReviewsCount, setTotalBuyerReviewsCount] = useState(0);
  const [totalSellerReviewsCount, setTotalSellerReviewsCount] = useState(0);

  // Review Filter State
  const [reviewFilter, setReviewFilter] = useState('all'); 

  // Listing Pagination - REMOVED (Moved to tabData)

  // Review Pagination States
  const [buyerPage, setBuyerPage] = useState(0);
  const [hasMoreBuyerReviews, setHasMoreBuyerReviews] = useState(false);
  const [isLoadingBuyerReviews, setIsLoadingBuyerReviews] = useState(false);

  const [sellerPage, setSellerPage] = useState(0);
  const [hasMoreSellerReviews, setHasMoreSellerReviews] = useState(false);
  const [isLoadingSellerReviews, setIsLoadingSellerReviews] = useState(false);
  
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isLoadingMoreListings, setIsLoadingMoreListings] = useState(false);
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
  
  // Fetches main profile data (Listings)
  const fetchTabData = useCallback(async (targetId, tabKey = 'all', page = 0, isLoadMore = false) => {
    // Determine loading state
    if (isLoadMore) {
      setIsLoadingMoreListings(true);
    } else {
      // If we are initializing a tab (page 0) and it's the first load of the page or tab switch
      if (page === 0) {
          setIsLoadingPageData(true);
      }
      setPageDataError(null);
    }
    
    try {
      // Fetch Listings for the requested tab/page
      let statusGroup = 'active';
      let listingType = null;

      if (tabKey === 'sold') {
          statusGroup = 'sold';
      } else if (tabKey === 'rent') {
          listingType = 'rent';
      } else if (tabKey === 'sale') {
          listingType = 'sale';
      }

      const listingsPromise = getUserListings(targetId, page, 8, false, statusGroup, listingType);
      const listingsResponse = await listingsPromise;
      
      const listingsData = listingsResponse.data;
      const newContent = listingsData.content || [];

      // Update tabData
      setTabData(prev => {
          const currentTab = prev[tabKey];
          const combinedListings = page === 0 ? newContent : [...currentTab.listings, ...newContent];
          
          return {
              ...prev,
              [tabKey]: {
                  listings: combinedListings,
                  page: listingsData.number,
                  hasMore: listingsData.number < listingsData.totalPages - 1,
                  initialized: true,
                  totalElements: listingsData.totalElements
              }
          };
      });

      // Only refetch likes on initial load of 'all' tab
      if (!isLoadMore && tabKey === 'all' && page === 0) {
        refetchLikes();
      }

    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      setPageDataError(err.message || "Could not load profile data.");
    } finally {
      setIsLoadingMoreListings(false);
      setIsLoadingPageData(false);
    }
  }, [refetchLikes]); 

  // Fetch User Data Separate Effect
  useEffect(() => {
      const idToFetch = profileId || loggedInUser?.userId;
      if (idToFetch && !profileUser) {
          const fetchUser = async () => {
             try {
                let userPromise;
                if (profileId) {
                    userPromise = fetchUserById(profileId); 
                } else {
                    userPromise = getCurrentUser();
                }
                const userResponse = await userPromise;
                setProfileUser(userResponse.data);
                
                // Initiate the review fetches only after user is loaded
                fetchBuyerReviews(idToFetch, 0);
                fetchSellerReviews(idToFetch, 0);
             } catch (err) {
                 console.error("Failed to fetch user:", err);
                 setPageDataError("Failed to load user profile.");
             }
          };
          fetchUser();
      }
  }, [profileId, loggedInUser, profileUser, fetchBuyerReviews, fetchSellerReviews]); 

  // Resets current tab data
  const refreshData = useCallback(() => {
    const idToFetch = profileId || loggedInUser?.userId;
    if (idToFetch) {
        fetchTabData(idToFetch, listingFilter, 0);
    }
  }, [profileId, loggedInUser, fetchTabData, listingFilter]);

  // Handler for Load More Listings
  // Handler for Load More Listings
  const handleLoadMoreListings = () => {
    if (isLoadingMoreListings) return;
    const idToFetch = profileId || loggedInUser?.userId;
    
    const currentTabData = tabData[listingFilter];
    
    if (idToFetch && currentTabData.hasMore) {
        fetchTabData(idToFetch, listingFilter, currentTabData.page + 1, true); 
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

  // --- Data for Current View ---
  const currentTabListings = tabData[listingFilter]?.listings || [];
  
  // Search logic applied to current results
  const { searchQuery, handleSearch, filteredListings: displayedListings } = useSearch(
    currentTabListings,
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

  // Initial Data Load & Tab Switching
  // Initial Data Load & Tab Switching
  useEffect(() => {
    const idToFetch = profileId || loggedInUser?.userId;
    if (idToFetch) {
        // If current tab is not initialized, fetch it
        if (!tabData[listingFilter].initialized) {
            fetchTabData(idToFetch, listingFilter, 0);
        }
    }
  }, [profileId, loggedInUser?.userId, fetchTabData, listingFilter, tabData]);

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

  const isPageLoading = isLoadingAuth || (isLoadingPageData && tabData.all.page === 0 && !tabData.all.initialized) || isLoadingLikes;
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
               {/* Share Button with Tooltip */}
               <div className="share-tooltip-container">
                 <button className="share-tooltip-btn" title="Share profile">
                   <svg
                     className="share-icon-svg"
                     xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 24 24"
                     width="24"
                     height="24"
                   >
                     <path
                       d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
                     />
                   </svg>
                 </button>
                 <div className="share-tooltip-content">
                   <div className="share-social-icons">
                     {/* Facebook */}
                     <a
                       href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/profile/${profileUser?.userId}`)}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="share-social-icon facebook"
                       title="Share on Facebook"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                         <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                       </svg>
                     </a>
                     {/* Messenger */}
                     <a
                       href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(`${window.location.origin}/profile/${profileUser?.userId}`)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(window.location.origin)}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="share-social-icon messenger"
                       title="Share via Messenger"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                         <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z" />
                       </svg>
                     </a>
                     {/* Microsoft Teams */}
                     <a
                       href={`https://teams.microsoft.com/share?href=${encodeURIComponent(`${window.location.origin}/profile/${profileUser?.userId}`)}&msgText=${encodeURIComponent(`Check out ${profileUser?.fullName}'s profile on Edu-Rent!`)}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="share-social-icon teams"
                       title="Share on Microsoft Teams"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                         <path d="M19.5 4C18.12 4 17 5.12 17 6.5c0 1.38 1.12 2.5 2.5 2.5S22 7.88 22 6.5C22 5.12 20.88 4 19.5 4zM14.5 5C12.57 5 11 6.57 11 8.5c0 1.93 1.57 3.5 3.5 3.5S18 10.43 18 8.5C18 6.57 16.43 5 14.5 5zM18 13h3c.55 0 1 .45 1 1v5c0 1.1-.9 2-2 2h-2v-8zM8 13v9c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1z" />
                       </svg>
                     </a>
                     {/* Instagram */}
                     <button
                       onClick={() => {
                         const url = `${window.location.origin}/profile/${profileUser?.userId}`;
                         navigator.clipboard.writeText(url)
                           .then(() => showSuccess('Profile link copied! Share it on Instagram.'))
                           .catch(() => showError('Failed to copy link.'));
                       }}
                       className="share-social-icon instagram"
                       title="Copy link for Instagram"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                         <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                       </svg>
                     </button>
                   </div>
                 </div>
               </div>
             </div> 
          </div>
        </section>

        {/* Tabs Section */}
        <section className="content-card">
          <div className="profile-tabs">
            <button className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
              Listings ({tabData[listingFilter]?.totalElements || 0})
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
                
                {/* Show Skeleton if tab is not initialized yet */}
                {!tabData[listingFilter].initialized ? (
                    <div className="listing-grid">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="listing-card skeleton" style={{ height: '300px' }}></div>
                      ))}
                    </div>
                ) : displayedListings.length > 0 ? (
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
                    <LoadMoreButton onLoadMore={handleLoadMoreListings} isLoading={isLoadingMoreListings} hasMore={tabData[listingFilter]?.hasMore} />
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
        listings={(tabData.all.listings || []).filter(l => l.status !== 'Sold' && l.status !== 'Inactive')} 
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
// src/pages/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
// Import NEW API functions
import { getCurrentUser, getUserListings, getUserReviews } from '../services/apiService';
import ShareIcon from '../assets/share.png';
import ListingCard from '../components/ListingCard'; // Ensure this is imported
import ProductDetailModal from '../components/ProductDetailModal'; // Import modal

import '../static/ProfilePage.css';
import '../static/DashboardPage.css'; // For shared styles like listing-grid, empty-state, etc.

// --- Loading Skeleton Component (Keep as before) ---
function ProfileSkeleton() {
  // Assuming styles are in ProfilePage.css or globally
  return (
    <main className="dashboard-body"> {/* Use main container */}
      <div className="content-card profile-card skeleton"> {/* Add skeleton class */}
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
        <div className="content-card skeleton" style={{ height: '300px', marginTop: '1.5rem'}}></div> {/* Placeholder for listings/reviews card */}
    </main>
  );
 }

// --- Profile Details Modal Component (Keep as before) ---
function ProfileDetailsModal({ user, onClose }) {
  if (!user) return null;

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
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
          <div className="modal-description">
            {user.bio || 'No bio provided.'}
          </div>
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

// --- Error Display Component (Keep as before) ---
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

// --- Review Card Component (Adjust props based on ReviewEntity) ---
function ReviewCard({ review }) {
  // Assuming ReviewEntity has reviewer.fullName, rating, comment, createdAt
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
  const [userData, setUserData] = useState(null);
  const [originalListings, setOriginalListings] = useState([]); // For resetting search
  const [userListings, setUserListings] = useState([]); // For display
  const [userReviews, setUserReviews] = useState([]); // Start empty
  const [activeTab, setActiveTab] = useState('listings');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListingModal, setSelectedListingModal] = useState(null); // State for product modal
  const navigate = useNavigate();

  // --- Reusable Fetch Function ---
  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get Current User
      const userResponse = await getCurrentUser();
      const currentUserData = userResponse.data;
      if (!currentUserData || !currentUserData.userId) {
          throw new Error("Could not load user profile.");
      }
      setUserData(currentUserData);
      const userId = currentUserData.userId;

      // 2. Fetch User's Listings and Reviews in parallel
      const listingsPromise = getUserListings(userId);
      const reviewsPromise = getUserReviews(userId);

      const [listingsResponse, reviewsResponse] = await Promise.all([
          listingsPromise,
          reviewsPromise
      ]);

      console.log("Fetched user listings:", listingsResponse.data);
      console.log("Fetched user reviews:", reviewsResponse.data);

      setUserListings(listingsResponse.data || []);
      setOriginalListings(listingsResponse.data || []); // <-- Set original list for search
      setUserReviews(reviewsResponse.data || []);

    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      setError(err.message || "Could not load profile. Please try again.");
      // Check for auth errors specifically
      if (err.response?.status === 401 || err.response?.status === 403 || err.message === "No authentication token found.") {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Fetch User Data, Listings, and Reviews on load ---
  useEffect(() => {
    fetchProfileData();
  }, [navigate]); // navigate is unlikely to change, but good practice

  // --- Modal Handlers ---
  const openProfileModal = () => setIsModalOpen(true); // For Profile Details
  const closeProfileModal = () => setIsModalOpen(false);
  const openListingModal = (listing) => { // For Product Details
      setSelectedListingModal(listing);
  };
  const closeListingModal = () => {
      setSelectedListingModal(null);
  };
  // ---

  // --- Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  // --- Search Handler (Filters fetched listings) ---
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.trim() === '') {
      setUserListings(originalListings); // Reset to original fetched list
    } else {
      const filtered = originalListings.filter( // Filter from the original list
        (listing) =>
          listing.title.toLowerCase().includes(query) ||
          (listing.description && listing.description.toLowerCase().includes(query))
      );
      setUserListings(filtered);
    }
  };

  // --- Retry Handler ---
  const handleRetry = () => {
     fetchProfileData(); // Re-run the fetch logic
  };

  // --- Share Profile Handler ---
  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${userData?.userId}`;
    const profileName = userData?.fullName || 'User';

    if (navigator.share) {
      navigator.share({
        title: `${profileName}'s Profile on Edu-Rent`,
        text: `Check out ${profileName}'s profile on Edu-Rent!`,
        url: profileUrl,
      }).catch(err => console.error("Share failed:", err));
    } else {
      navigator.clipboard.writeText(profileUrl)
       .then(() => alert('Profile link copied to clipboard!'))
       .catch(err => {
            console.error("Clipboard copy failed:", err);
            alert('Failed to copy link.');
       });
    }
  };

  // --- Calculate Average Rating ---
  const averageRating = userReviews.length > 0
    ? (userReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / userReviews.length).toFixed(1)
    : 0;

  // --- Render Loading State ---
  if (isLoading) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={handleLogout} />
        <ProfileSkeleton />
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={handleLogout} />
        <main className="dashboard-body">
            <ErrorDisplay error={error} onRetry={handleRetry} />
        </main>
      </div>
    );
  }

  // --- Render Not Found State ---
  if (!userData) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={handleLogout} />
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

  // --- Format Joined Date ---
  const joinedDate = userData.createdAt 
    ? new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) 
    : 'N/A';

  // --- Use userListings state for display ---
  const displayedListings = userListings;

  return (
    <div className="profile-page">
      <Header
        userName={userData.fullName?.split(' ')[0]}
        onLogout={handleLogout}
      />

      <main className="dashboard-body">
        {/* Profile Section Card */}
        <section className="content-card profile-card">
          <div className="profile-card-left"> <img src={userData.profilePictureUrl || 'https://via.placeholder.com/120'} alt={`${userData.fullName}'s profile`} className="profile-picture"/> </div>
          <div className="profile-card-center"> <h1 className="profile-name">{userData.fullName}</h1> <button onClick={openProfileModal} className="profile-details-link"> Profile Details &gt; </button> </div>
          <div className="profile-card-right"> <div className="profile-card-rating"><span>⭐</span><span>{averageRating}</span></div> <div className="profile-card-reviews">{userReviews.length} reviews</div> <div className="profile-card-joined"><span>Joined </span><span>{joinedDate}</span></div> <div className="profile-card-actions"> <button className="btn btn-small btn-primary" onClick={() => navigate('/settings/profile')}> Edit Profile </button> <button className="icon-button" onClick={handleShareProfile} title="Share profile"> <img src={ShareIcon} alt="Share"/> </button> </div> </div>
        </section>

        {/* Listings & Reviews Section */}
        <section className="content-card">
          <div className="profile-tabs">
            <button className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
              {/* Display count from fetched listings */}
              Listings ({displayedListings.length})
            </button>
            <button className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
              {/* Display count from fetched reviews */}
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
                      onChange={handleSearchChange} // Use the handler
                      aria-label="Search your listings"
                    />
                    <button className="btn btn-small btn-primary-accent" onClick={() => navigate('/manage-listings')}>
                      Manage Listings
                    </button>
                  </div>
                </div>
                {/* --- Render Fetched Listings --- */}
                {displayedListings.length > 0 ? (
                  <div className="listing-grid">
                    {displayedListings.map((listing) => (
                      // Use listingId and pass openListingModal
                      <ListingCard
                          key={listing.listingId}
                          listing={listing}
                          onClick={openListingModal} // Use handler for product modal
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
                {/* --------------------------- */}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="profile-reviews-section">
                <h2 className="profile-listings-title" style={{ marginBottom: '1.5rem' }}>
                  Reviews Received
                </h2>
                {/* --- Render Fetched Reviews --- */}
                {userReviews.length > 0 ? (
                  userReviews.map((review) => (
                    // Use reviewId from backend as key
                    <ReviewCard key={review.reviewId} review={review} />
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">⭐</div>
                    <div className="empty-state-title">No Reviews Yet</div>
                    <p>Complete transactions for reviews.</p>
                  </div>
                )}
                {/* ------------------------- */}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      {isModalOpen && <ProfileDetailsModal user={userData} onClose={closeProfileModal} />}
      {selectedListingModal && <ProductDetailModal listing={selectedListingModal} onClose={closeListingModal} />}

    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getCurrentUser } from '../services/apiService';
import ShareIcon from '../assets/share.png'; // Make sure this path is correct

import '../static/ProfilePage.css';
// Ensure DashboardPage CSS is imported if listing-grid etc. are needed
import '../static/DashboardPage.css';

// --- Mock Data (Keep for now) ---
const MOCK_USER_LISTINGS = [
 { id: 1, title: 'Calculus 1 Textbook', description: 'Selling my old calc book', price: 30, type: 'sale', category: 'Textbooks', image: null, icon: '📚' },
 { id: 3, title: 'Desk Lamp', description: 'Renting out my extra lamp', price: 10, type: 'rent', category: 'Furniture', image: null, icon: '💡' },
];
const MOCK_REVIEWS = [
 { id: 1, reviewer: 'Jane S.', rating: 5, comment: 'Great seller, fast meetup!', date: '2025-10-20' },
 { id: 2, reviewer: 'Mike R.', rating: 4, comment: 'Item was as described, good rental.', date: '2025-10-15' },
];

// --- Loading Skeleton Component ---
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


// --- Profile Details Modal Component ---
function ProfileDetailsModal({ user, onClose }) {
 if (!user) return null;

 const joinedDate = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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
         {/* Fixed template literal */}
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

// --- Error Boundary Component (Simplified Usage) ---
function ErrorDisplay({ error, onRetry }) { // Renamed for clarity
 return (
   <div className="error-container" style={{ margin: '2rem auto', maxWidth: '600px'}}> {/* Centered */}
     <div className="error-title">⚠️ Something went wrong</div>
     <div className="error-message">{error}</div>
     <button className="error-retry-btn" onClick={onRetry}>
       Try Again
     </button>
   </div>
 );
}

// --- Listing Card Component ---
function ListingCard({ listing }) {
 return (
   <div className="listing-card">
     <div className="listing-image">
       {listing.image ? (
         <img src={listing.image} alt={listing.title} />
       ) : (
         <span>{listing.icon || '📦'}</span>
       )}
     </div>
     <div className="listing-content">
       <div className="listing-category">{listing.category}</div>
       <h3 className="listing-title">{listing.title}</h3>
       <p className="listing-description">{listing.description}</p>
       <div className="listing-footer">
         {/* Fixed template literal */}
         <div className="listing-price">₱{listing.price}</div>
         {/* Fixed template literal in className */}
         <span className={`listing-type ${listing.type}`}>
           {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
         </span>
       </div>
     </div>
   </div>
 );
}

// --- Review Card Component ---
function ReviewCard({ review }) {
 return (
   <div className="review-card"> {/* Added class */}
     <div className="review-header">
       <strong className="review-reviewer">{review.reviewer}</strong>
       <span className="review-rating">
         {'⭐'.repeat(review.rating)}
         {'☆'.repeat(5 - review.rating)}
       </span>
     </div>
     <p className="review-comment">{review.comment}</p>
     <small className="review-date">
       {new Date(review.date).toLocaleDateString()}
     </small>
   </div>
 );
}

// --- Main Profile Page Component ---
export default function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [userListings, setUserListings] = useState(MOCK_USER_LISTINGS);
  const [userReviews, setUserReviews] = useState(MOCK_REVIEWS);
  const [activeTab, setActiveTab] = useState('listings');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const navigate = useNavigate();

  // --- Fetch User Data ---
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getCurrentUser();
        setUserData(response.data);
         // TODO: Fetch user's actual listings and reviews
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
        setError("Could not load profile. Please try again or log in.");
        if (err.message === "No authentication token found.") { // More specific check
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [navigate]);

  // --- Modal Handlers ---
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  // ---

  // --- Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  // --- Search Handler ---
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    // TODO: Filter actual listings when fetched
    if (query.trim() === '') {
      setUserListings(MOCK_USER_LISTINGS);
    } else {
      const filtered = MOCK_USER_LISTINGS.filter(
        (listing) =>
          listing.title.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query)
      );
      setUserListings(filtered);
    }
  };

  // --- Retry Handler ---
  const handleRetry = () => {
     // Re-trigger useEffect by potentially changing a dependency or calling fetch directly
     // Simplest way for now: re-call fetch
     const fetchProfileData = async () => {
        setIsLoading(true); // Set loading true again
        setError(null);
        try {
            const response = await getCurrentUser();
            setUserData(response.data);
        } catch (err) {
            console.error("Failed to fetch profile data on retry:", err);
            setError("Could not load profile. Please try again.");
             if (err.message === "No authentication token found.") {
               navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    };
    fetchProfileData();
  };

  // --- Share Profile Handler ---
  const handleShareProfile = () => {
     // Fixed template literals and use userId
    const profileUrl = `${window.location.origin}/profile/${userData?.userId}`; // Use userId
    const profileName = userData?.fullName || 'User';

    if (navigator.share) {
      navigator.share({
        title: `${profileName}'s Profile on Edu-Rent`,
        text: `Check out ${profileName}'s profile on Edu-Rent!`,
        url: profileUrl,
      }).catch(err => console.error("Share failed:", err)); // Add error handling
    } else {
      navigator.clipboard.writeText(profileUrl)
       .then(() => alert('Profile link copied to clipboard!'))
       .catch(err => {
            console.error("Clipboard copy failed:", err);
            alert('Failed to copy link.'); // Inform user on failure
        });
    }
  };

  // --- Calculate Average Rating ---
  const averageRating = userReviews.length > 0
    ? (userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length).toFixed(1)
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
            {/* Simplified error display */}
            <ErrorDisplay error={error} onRetry={handleRetry} />
        </main>
      </div>
    );
  }

  // --- Render Not Found State (Should ideally happen if API returns 404) ---
  if (!userData) {
    // This case might not be reached if fetchUser redirects on token error
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

  // --- Render Profile Page ---
  return (
    <div className="profile-page">
      <Header
        userName={userData.fullName?.split(' ')[0]}
        onLogout={handleLogout}
      />

      <main className="dashboard-body">
        {/* Profile Section Card */}
        <section className="content-card profile-card">
          <div className="profile-card-left">
            <img
              src={userData.profilePictureUrl || 'https://via.placeholder.com/120'}
              // Fixed template literal
              alt={`${userData.fullName}'s profile`}
              className="profile-picture"
            />
          </div>
          <div className="profile-card-center">
            <h1 className="profile-name">
              {userData.fullName}
              {/* VerificationBadge removed */}
            </h1>
            <button onClick={openModal} className="profile-details-link" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              Profile Details &gt;
            </button>
          </div>
          <div className="profile-card-right">
             {/* Fixed template literals */}
            <div className="profile-card-rating" aria-label={`Average rating ${averageRating} out of 5 from ${userReviews.length} reviews`}>
              <span className="profile-rating-stars" aria-hidden="true">⭐</span>
              <span className="profile-card-rating-value">{averageRating}</span>
            </div>
            {/* Fixed template literal */}
            <div className="profile-card-reviews" aria-label={`${userReviews.length} reviews`}>
              {userReviews.length} reviews
            </div>
            <div className="profile-card-joined">
              <span className="muted">Joined </span>
              <span className="profile-card-joined-value">{joinedDate}</span>
            </div>
            <div className="profile-card-actions">
              <button
                className="btn btn-small btn-primary" // Assuming these styles exist
                onClick={() => navigate('/settings/profile')}
              >
                Edit Profile
              </button>
              <button
                className="icon-button" // Assuming this style exists
                aria-label="Share profile"
                onClick={handleShareProfile}
                title="Share profile"
              >
                <img src={ShareIcon} alt="Share" style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>
        </section>

        {/* Listings & Reviews Section */}
        <section className="content-card">
          <div className="profile-tabs">
            {/* Fixed template literals */}
            <button
              className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`}
              onClick={() => setActiveTab('listings')}
            >
              Listings ({userListings.length})
            </button>
            {/* Fixed template literals */}
            <button
              className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
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
                      className="profile-search-input" // Make sure this style exists
                      value={searchQuery}
                      onChange={handleSearchChange}
                      aria-label="Search your listings"
                    />
                     {/* Assuming these btn styles exist */}
                    <button
                      className="btn btn-small btn-primary-accent"
                      onClick={() => navigate('/manage-listings')} // Needs route
                    >
                      Manage Listings
                    </button>
                  </div>
                </div>
                {userListings.length > 0 ? (
                  <div className="listing-grid">
                    {userListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state"> {/* Assuming styles exist */}
                    <div className="empty-state-icon">📦</div>
                    <div className="empty-state-title">
                      {searchQuery ? 'No Listings Found' : 'No Listings Yet'}
                    </div>
                    <p className="empty-state-description">
                      {searchQuery
                        ? 'Try adjusting your search terms'
                        : "You haven't listed any items yet. Start selling today!"}
                    </p>
                    {!searchQuery && (
                      <button
                        className="empty-state-action" // Assuming style exists
                        onClick={() => navigate('/list-item')}
                      >
                        Create Your First Listing
                      </button>
                    )}
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
                    <ReviewCard key={review.id} review={review} />
                  ))
                ) : (
                  <div className="empty-state"> {/* Assuming styles exist */}
                    <div className="empty-state-icon">⭐</div>
                    <div className="empty-state-title">No Reviews Yet</div>
                    <p className="empty-state-description">
                      Complete transactions to receive reviews from other users.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modal */}
      {isModalOpen && <ProfileDetailsModal user={userData} onClose={closeModal} />}

    </div>
  );
}
// src/components/ProductDetailModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Import CSS
import '../static/ProductDetailModal.css';
import '../static/ProfilePage.css'; // For modal-overlay styles
import '../static/DashboardPage.css'; // For .like-button styles

/**
 * Helper function to extract and format seller data from the listing's user object.
 */
const getSellerInfo = (listingUser) => {
  const defaultUser = { userId: null, fullName: 'Seller Unknown', profilePictureUrl: null, school: { name: 'N/A' } };
  const user = listingUser || defaultUser;
  return {
    id: user.userId,
    username: user.fullName || 'Seller Unknown',
    avatarUrl: user.profilePictureUrl || null,
    // reviewCount and ratingAvg are placeholders; real data would require a separate query.
    reviewCount: 'N/A',
    ratingAvg: 'N/A',
  };
};

// --- MODIFIED: Added isLiked and onLikeClick props ---
export default function ProductDetailModal({ listing, onClose, currentUserId, isLiked, onLikeClick, isLiking }) {
    const navigate = useNavigate();

  if (!listing) return null;

  
  // Get all image URLs, defaulting to an empty array
  const images = Array.isArray(listing.images) ? listing.images.map(img => img.imageUrl) : [];

  // Find the index of the cover photo, or default to 0
  const initialImageIndex = Math.max(0, images.findIndex(img => 
      listing.images.find(li => li.imageUrl === img)?.isCoverPhoto
  ));

  // Set the starting image index
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  
  const showArrows = images.length > 1;
  const currentImageUrl = images[currentImageIndex] || 'https://via.placeholder.com/400x400?text=No+Image';

  // --- Handlers ---
  const handlePrevImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1); };
  const handleNextImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1); };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };
  const handleChatClick = () => {
    const sellerId = listing?.user?.userId;
    console.log(`Initiating chat for listing ${listing.listingId} with seller ${sellerId}`);
    navigate('/messages'); // Navigate to general messages for now
    onClose();
  };

  // --- NEW: Passes the like event up to the parent component (DashboardPage) ---
  const handleLikeClick = (e) => {
    e.stopPropagation(); // Stop click from propagating
    if (onLikeClick) {
      onLikeClick(listing.listingId); // Pass the listing's ID up
    }
  };

  // --- Format Data ---
  const priceDisplay = `₱${(listing.price || 0).toFixed(2)}`;
  const isRent = listing.listingType?.toUpperCase().includes('RENT');
  const typeText = isRent ? 'Want to rent the item?' : 'Want to buy the item?';
  const seller = getSellerInfo(listing.user); // Get seller info
  const isOwner = currentUserId === listing?.user?.userId;

  return (
    <div className="modal-overlay visible" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="product-name">
      <div className="product-modal-content">

        {/* Image Section */}
        <section className="product-image-section">
          <img
            src={`http://localhost:8080${currentImageUrl}`} // Assuming relative path
            alt={`${listing.title || 'Listing'} - Image ${currentImageIndex + 1}`}
            className="product-image-main"
            onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/400x400?text=Image+Error"; }}
          />
          {showArrows && (
            <>
              <button className="image-nav-arrow left" onClick={handlePrevImage}>&#10094;</button>
              <button className="image-nav-arrow right" onClick={handleNextImage}>&#10095;</button>
            </>
          )}
        </section>

        {/* Details Section */}
        <section className="product-details-section">
          <button onClick={onClose} className="product-modal-close-btn" aria-label="Close modal">&times;</button>

          {/* Product Info */}
          <div>
            {/* --- MODIFIED: Flex container to hold the title and the like button side-by-side --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 id="product-name" className="product-info-name">{listing.title || 'No Title'}</h2>
              
              {/* --- NEW: Like Button --- */}
              {/* Only show like button if NOT the owner */}
              {!isOwner && (
                <button
                  className={`like-button ${isLiked ? 'liked' : ''}`}
                  onClick={handleLikeClick}
                  disabled={isLiking}
                  aria-label={isLiked ? 'Unlike item' : 'Like item'}
                  title={isLiked ? 'Unlike' : 'Like'}
                  style={{ position: 'relative', top: '5px', right: '5px', flexShrink: 0 }} // Keep button from shrinking
                >
                  {isLiking ? '...' : (isLiked ? '❤️' : '🤍')}
                </button>
              )}
            </div>

            <p className="product-info-price">{priceDisplay}</p>
            <div className="product-info-block">
              <span className="product-info-label">Location:</span>
              <span className="product-info-value">{listing.allowMeetup && listing.meetupLocation ? listing.meetupLocation : 'N/A'}</span>
            </div>
            <div className="product-info-block">
              <span className="product-info-label">School:</span>
              <span className="product-info-value">{listing.user?.school?.name || 'N/A'}</span>
            </div>
            <div className="product-info-block">
              <span className="product-info-label">Condition:</span>
              <span className="product-info-value">{listing.condition || 'Not specified'}</span>
            </div>
              <div className="product-info-block">
                <span className="product-info-label">Deal Method:</span>
                <span className="product-info-value">
                    {listing.allowMeetup ? 'Meet-up' : ''}
                    {listing.allowMeetup && listing.allowDelivery ? ', ' : ''}
                    {listing.allowDelivery ? `Delivery (${listing.deliveryOptions || 'Not specified'})` : ''}
                    {!listing.allowMeetup && !listing.allowDelivery ? 'Not specified' : ''}
                </span>
              </div>
            <div className="product-info-block">
              <span className="product-info-label">Description:</span>
              <p className="product-info-value product-info-description">
                {listing.description || 'No description available.'}
              </p>
            </div>
          </div>

            {/* Seller Info Section */}
          <div className="seller-info-section">
            {isOwner ? (
              <>
                {/* --- OWNER'S VIEW --- */}
                <div className="seller-info-header">
                  <img
                    src={
                      seller.avatarUrl
                        ? `http://localhost:8080${seller.avatarUrl}`
                        : "https://via.placeholder.com/45"
                    }
                    alt={`${seller.username}'s avatar`}
                    className="seller-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/45";
                    }}
                  />
                  <div className="seller-details">
                    <div className="seller-username">{seller.username} (You)</div>
                    <div className="seller-reviews">Reviews: N/A</div>
                  </div>
                </div>

                <div
                  className="action-note"
                  style={{ fontStyle: "italic", color: "var(--text-color)" }}
                >
                  This is your listing.
                </div>

                <button
                  className="btn-chat"
                  style={{ backgroundColor: "var(--text-muted)" }}
                  onClick={() => {
                    navigate(`/edit-listing/${listing.listingId}`);
                    onClose();
                  }}
                >
                  Edit Your Listing
                </button>
                {/* --- END: OWNER'S VIEW --- */}
              </>
            ) : (
              <>
                {/* --- START: OTHER USER'S VIEW --- */}
                <div className="seller-info-header">
                  <img
                    src={
                      seller.avatarUrl
                        ? `http://localhost:8080${seller.avatarUrl}`
                        : "https://via.placeholder.com/45"
                    }
                    alt={`${seller.username}'s avatar`}
                    className="seller-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/45";
                    }}
                  />

                  <div className="seller-details">
                    <div className="seller-username">{seller.username}</div>
                    <div className="seller-reviews">Reviews: N/A</div>
                  </div>
                </div>

                <div className="action-note">{typeText}</div>

                <button className="btn-chat" onClick={handleChatClick}>
                  Chat with the Seller
                </button>
                {/* --- END: OTHER USER'S VIEW --- */}
              </>
            )}
          </div>

        </section>
      </div>
    </div>
  );
}
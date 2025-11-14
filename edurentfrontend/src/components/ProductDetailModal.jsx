// src/components/ProductDetailModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Import CSS
import '../static/ProductDetailModal.css';
import '../static/ProfilePage.css'; // Assuming modal-overlay is here

// --- Helper to Extract Seller Info ---
// Extracts basic info directly available from the eagerly loaded user object
const getSellerInfo = (listingUser) => {
    // Provide defaults for safety
    const defaultUser = { userId: null, fullName: 'Seller Unknown', profilePictureUrl: null, school: { name: 'N/A' } };
    const user = listingUser || defaultUser;
    return {
        id: user.userId,
        // Use full name directly, display first name if needed in JSX
        username: user.fullName || 'Seller Unknown',
        avatarUrl: user.profilePictureUrl || null, // Use the actual picture URL
         // Placeholder - Real data requires separate fetch or backend DTO modification
        reviewCount: 'N/A',
        ratingAvg: 'N/A',
    };
};


export default function ProductDetailModal({ listing, onClose, currentUserId }) {
  const navigate = useNavigate();

  if (!listing) return null;

  // --- IMAGES & INITIAL INDEX (Moved before useState) ---
  // *** FIX 1: Use listing.images (from your "current" code) ***
  const images = Array.isArray(listing.images) ? listing.images.map(img => img.imageUrl) : [];
  
  // Find cover image explicitly, fallback to first, then placeholder URL
  // *** FIX 1 (cont.): Use listing.images here too ***
  const initialImageIndex = Math.max(0, images.findIndex(img => listing.images.find(li => li.imageUrl === img)?.isCoverPhoto));

  // --- STATE ---
  // *** FIX 2: Initialize state with the calculated initialImageIndex ***
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  // *** (Removed the bad second useState call) ***

  const showArrows = images.length > 1;
  const currentImageUrl = images[currentImageIndex] || 'https://via.placeholder.com/400x400?text=No+Image';

  // --- Handlers (no change) ---
  const handlePrevImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1); };
  const handleNextImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1); };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };
  const handleChatClick = () => {
      const sellerId = listing?.user?.userId;
      console.log(`Initiating chat for listing ${listing.listingId} with seller ${sellerId}`);
      navigate('/messages'); // Navigate to general messages for now
      onClose();
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
            <h2 id="product-name" className="product-info-name">{listing.title || 'No Title'}</h2>
            <p className="product-info-price">{priceDisplay}</p>
            <div className="product-info-block">
              <span className="product-info-label">Location:</span>
              <span className="product-info-value">{listing.allowMeetup && listing.meetupLocation ? listing.meetupLocation : 'N/A'}</span>
            </div>
            <div className="product-info-block">
              <span className="product-info-label">School:</span>
              {/* This HTML structure from "modified" code is correct */}
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

          {/* Seller Info */}
      {!isOwner && (
          <div className="seller-info-section">
            <div className="seller-info-header">
              <img
                // Use seller.avatarUrl (from listing.user.profilePictureUrl)
                src={seller.avatarUrl ? `http://localhost:8080${seller.avatarUrl}` : 'https://via.placeholder.com/45'} // Assuming relative path for profile pics too
                alt={`${seller.username}'s avatar`}
                className="seller-avatar"
                 onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/45"; }} // Fallback avatar
              />
                 <div className="seller-details">
                 {/* Use seller.username (full name from listing.user) */}
                <div className="seller-username">{seller.username}</div>
                <div className="seller-reviews">
                   Reviews: N/A {/* Placeholder */}
                </div>
              </div>
            </div>
            <div className="action-note">
              {typeText}
            </div>
            <button className="btn-chat" onClick={handleChatClick}>
              Chat with the Seller
            </button>
          </div>
          )}
        </section>
      </div>
    </div>
  );
}
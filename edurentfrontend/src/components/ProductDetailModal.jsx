// src/components/ProductDetailModal.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// --- NEW IMPORT (From Modified Code) ---
import { startConversation } from '../services/apiService'; 

// Import CSS
import '../static/ProductDetailModal.css';
import '../static/ProfilePage.css';
import '../static/DashboardPage.css';
import defaultAvatar from '../assets/default-avatar.png'; 

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
    reviewCount: 'N/A', 
    ratingAvg: 'N/A',   
  };
};

export default function ProductDetailModal({ listing, onClose, currentUserId, isLiked, onLikeClick, isLiking }) {
  const navigate = useNavigate();
  const [isStartingChat, setIsStartingChat] = useState(false); // Loading state for chat

  if (!listing) return null;

  // --- MERGED IMAGE LOGIC ---
  // Checks for 'listingImages' (Modified) OR 'images' (Current) to prevent crashes
  const rawImages = listing.listingImages || listing.images || [];
  const images = Array.isArray(rawImages) ? rawImages.map(img => img.imageUrl) : [];

  // Find the index of the cover photo, or default to 0
  const initialImageIndex = Math.max(0, images.findIndex(img => 
      rawImages.find(li => li.imageUrl === img)?.isCoverPhoto 
  ));

  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  
  const showArrows = images.length > 1;
  const currentImageUrl = images[currentImageIndex] || 'https://via.placeholder.com/400x400?text=No+Image';

  // --- Handlers ---
  const handlePrevImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1); };
  const handleNextImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1); };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  // --- UPDATED: Chat Click Handler ---
  const handleChatClick = async () => {
    if (!currentUserId) {
        alert("Please log in to chat with the seller.");
        navigate('/login');
        return;
    }

    const sellerId = listing?.user?.userId;
    if (!sellerId) {
        console.error("Cannot start chat: Seller ID missing");
        return;
    }

    setIsStartingChat(true);

    try {
        console.log(`Starting conversation... Listing: ${listing.listingId}, Starter: ${currentUserId}, Receiver: ${sellerId}`);
        
        // Call the API to get or create the conversation
        // Returns the conversation object
        const response = await startConversation(listing.listingId, currentUserId, sellerId);
        
        const conversationId = response.data.conversationId;
        
        // Navigate to messages page AND pass the conversation ID in the state
        navigate('/messages', { state: { openConversationId: conversationId } });
        onClose();

    } catch (error) {
        console.error("Failed to start conversation:", error);
        alert("Could not start chat. Please try again.");
    } finally {
        setIsStartingChat(false);
    }
  };

  // Passes the like event up to the parent component
  const handleLikeClick = (e) => {
    e.stopPropagation(); 
    if (onLikeClick) {
      onLikeClick(listing.listingId);
    }
  };

  // --- Format Data ---
  const priceDisplay = `₱${(listing.price || 0).toFixed(2)}`;
  const isRent = listing.listingType?.toUpperCase().includes('RENT');
  const typeText = isRent ? 'Want to rent the item?' : 'Want to buy the item?';
  const seller = getSellerInfo(listing.user);
  const isOwner = currentUserId === listing?.user?.userId;

  // Helper to construct image URL (handles local backend path vs placeholder)
  const getFullImageUrl = (path) => {
      if (!path) return 'https://via.placeholder.com/400x400?text=No+Image';
      return path.startsWith('http') ? path : `http://localhost:8080${path}`;
  };

  return (
    <div className="modal-overlay visible" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="product-name">
      <div className="product-modal-content">

        {/* Image Section */}
        <section className="product-image-section">
          <img
            src={getFullImageUrl(currentImageUrl)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 id="product-name" className="product-info-name">{listing.title || 'No Title'}</h2>
              
              {!isOwner && (
                <button
                  className={`like-button ${isLiked ? 'liked' : ''}`}
                  onClick={handleLikeClick}
                  disabled={isLiking}
                  aria-label={isLiked ? 'Unlike item' : 'Like item'}
                  title={isLiked ? 'Unlike' : 'Like'}
                  style={{ position: 'relative', top: '5px', right: '5px', flexShrink: 0 }}
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
                    src={seller.avatarUrl ? `http://localhost:8080${seller.avatarUrl}` : defaultAvatar}
                    alt={`${seller.username}'s avatar`}
                    className="seller-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
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
              </>
            ) : (
              <>
                {/* --- OTHER USER'S VIEW --- */}
                <div className="seller-info-header">
                  <img
                    src={seller.avatarUrl ? `http://localhost:8080${seller.avatarUrl}` : defaultAvatar}
                    alt={`${seller.username}'s avatar`}
                    className="seller-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                />
                  <div className="seller-details">
                    <div className="seller-username">
                        <Link to={`/profile/${seller.id}`} onClick={onClose} className="seller-link">
                            {seller.username}
                        </Link>
                    </div>
                    <div className="seller-reviews">Reviews: N/A</div>
                  </div>
                </div>

                <div className="action-note">{typeText}</div>

                {/* --- MERGED CHAT BUTTON --- */}
                <button 
                  className="btn-chat" 
                  onClick={handleChatClick}
                  disabled={isStartingChat} // Disable while loading
                >
                  {isStartingChat ? 'Starting Chat...' : 'Chat with the Seller'}
                </button>
              </>
            )}
          </div>

        </section>
      </div>
    </div>
  );
}
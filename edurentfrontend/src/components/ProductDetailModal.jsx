import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { startConversation } from '../services/apiService'; 
import MarkAsSoldModal from './MarkAsSoldModal';
import UserRatingDisplay from './UserRatingDisplay';

// Styles and Assets
import '../static/ProductDetailModal.css';
import '../static/ProfilePage.css';
import '../static/DashboardPage.css';
import defaultAvatar from '../assets/default-avatar.png'; 

/**
 * Normalizes seller data from potentially different API response structures.
 * Returns a consistent user object for display to prevent crashes.
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

export default function ProductDetailModal({ listing, onClose, currentUserId, isLiked, onLikeClick, isLiking, sellerRatingInitialData}) {
  const navigate = useNavigate();
  
  // --- UI State Management ---
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false);

  // Safety check: Immediately exit if no data is provided
  if (!listing) return null;

  // --- Data Parsing & Formatting ---

  // Check status and ownership
  const isSold = listing.status === 'Sold';
  const isOwner = currentUserId === listing?.user?.userId;
  const seller = getSellerInfo(listing.user);

  // Calculate stats
  const priceDisplay = `₱${(listing.price || 0).toFixed(2)}`;
  const isRent = listing.listingType?.toUpperCase().includes('RENT');
  const typeText = isRent ? 'Want to rent the item?' : 'Want to buy the item?';
  // --- DYNAMIC LIKE COUNT ---
  const serverLikeCount = listing.likes ? listing.likes.length : 0;

  const wasLikedInitial = useMemo(() => {
    if (!listing.likes || !currentUserId) return false;
    return listing.likes.some(like => like.id?.userId === currentUserId);
  }, [listing.likes, currentUserId]);

  let displayLikeCount = serverLikeCount;
  if (isLiked && !wasLikedInitial) {
    displayLikeCount++;
  } else if (!isLiked && wasLikedInitial) {
    displayLikeCount--;
  }
  displayLikeCount = Math.max(0, displayLikeCount);

  // --- Image Handling Logic ---
  // Consolidate image sources and determine the starting image (Cover > First > Default)
  const rawImages = listing.listingImages || listing.images || [];
  const images = Array.isArray(rawImages) ? rawImages.map(img => img.imageUrl) : [];

  const initialImageIndex = Math.max(0, images.findIndex(img => 
      rawImages.find(li => li.imageUrl === img)?.isCoverPhoto 
  ));

  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const showArrows = images.length > 1;
  const currentImageUrl = images[currentImageIndex] || 'https://via.placeholder.com/400x400?text=No+Image';

  // Helper to ensure image URLs are absolute
  const getFullImageUrl = (path) => {
      if (!path) return 'https://via.placeholder.com/400x400?text=No+Image';
      return path.startsWith('http') ? path : `http://localhost:8080${path}`;
  };

  // --- Event Handlers ---

  const handlePrevImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1); };
  const handleNextImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1); };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  const handleLikeClick = (e) => {
    e.stopPropagation(); 
    if (onLikeClick) onLikeClick(listing.listingId);
  };

  // Chat initiation logic
  const handleChatClick = async () => {
    if (!currentUserId) {
        alert("Please log in to chat with the seller.");
        navigate('/login');
        return;
    }

    const sellerId = listing?.user?.userId;
    if (!sellerId) return;

    setIsStartingChat(true);

    try {
        const response = await startConversation(listing.listingId, currentUserId, sellerId);
        const fullConversation = response.data;
        
        // Navigate to Messages and pass the conversation object
        navigate('/messages', { 
            state: { 
                openConversation: fullConversation,
                openConversationId: fullConversation.conversationId 
            } 
        });
        onClose();

    } catch (error) {
        console.error("Failed to start conversation:", error);
        alert("Could not start chat. Please try again.");
    } finally {
        setIsStartingChat(false);
    }
  };

  return (
    <div className="modal-overlay visible" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="product-modal-content">

        {/* --- Left Column: Image Carousel --- */}
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

        {/* --- Right Column: Product Details --- */}
        <section className="product-details-section">
          <button onClick={onClose} className="product-modal-close-btn" aria-label="Close modal">&times;</button>

          {/* Header Area */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h2 className="product-info-name" style={{ margin: 0 }}>
                {listing.title || 'No Title'}
                {/* Sold Badge */}
                {isSold && (
                  <span style={{
                    color: '#e53935', 
                    fontSize: '0.6em', 
                    marginLeft: '10px', 
                    verticalAlign: 'middle', 
                    border: '1px solid #e53935', 
                    padding: '2px 6px', 
                    borderRadius: '4px'
                  }}>
                    SOLD
                  </span>
                )}
              </h2>
              
              {/* Like Badge with Count */}
              <div 
                  onClick={(!isOwner && !isSold) ? handleLikeClick : undefined}
                  style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      backgroundColor: '#f1f3f5',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      cursor: (!isOwner && !isSold) ? 'pointer' : 'default',
                      flexShrink: 0,
                      opacity: isSold ? 0.7 : 1
                  }}
                  title={isOwner ? `${displayLikeCount} people liked this` : (isSold ? 'Item is sold' : (isLiked ? 'Unlike' : 'Like'))}
              >
                  <span style={{ fontSize: '1.2rem', lineHeight: 1, color: isOwner ? '#6c757d' : (isLiked ? '#e53935' : '#ccc') }}>
                      {isLiking ? '...' : (isOwner ? '🖤' : (isLiked ? '❤️' : '🤍'))}
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#495057' }}>
                      {displayLikeCount}
                  </span>
              </div>
            </div>

            <p className="product-info-price">{priceDisplay}</p>
            
            {/* Metadata Grid */}
            <div className="product-info-block">
              <span className="product-info-label">Location:</span>
              <span className="product-info-value">{listing.meetupLocation || 'N/A'}</span>
            </div>
            <div className="product-info-block">
              <span className="product-info-label">Condition:</span>
              <span className="product-info-value">{listing.condition || 'Not specified'}</span>
            </div>
            <div className="product-info-block">
              <span className="product-info-label">Description:</span>
              <p className="product-info-value product-info-description">
                {listing.description || 'No description available.'}
              </p>
            </div>
          </div>

          {/* --- Bottom Section: Seller Info & Actions --- */}
          <div className="seller-info-section">
            
            {/* 1. OWNER VIEW */}
            {isOwner ? (
              <>
                <div className="seller-info-header">
                  <img
                    src={
                      seller.avatarUrl 
                        ? (seller.avatarUrl.startsWith('http') ? seller.avatarUrl : `http://localhost:8080${seller.avatarUrl}`)
                        : defaultAvatar
                    }
                    alt="Seller Avatar"
                    className="seller-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                  />
                  <div className="seller-details">
                    <div className="seller-username">{seller.username} (You)</div>
                    <UserRatingDisplay userId={currentUserId} initialData={sellerRatingInitialData} />
                
                  </div>
                </div>

                {isSold ? (
                  /* Case A: Owner + Item Sold -> View Chat History */
                  <button
                    className="btn-chat"
                    style={{ backgroundColor: "#34495e", marginTop: '1rem' }} 
                    onClick={() => {
                        navigate('/messages', { state: { filterByListingId: listing.listingId } });
                        onClose();
                    }}
                  >
                    SOLD – View All Chat
                  </button>
                ) : (
                   /* Case B: Owner + Item Available -> Edit or Sell */
                   <>
                    <div className="action-note" style={{ fontStyle: "italic", color: "var(--text-color)" }}>
                      This is your listing.
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                          className="btn-chat"
                          style={{ backgroundColor: "var(--text-muted)", flex: 1 }}
                          onClick={() => { navigate(`/edit-listing/${listing.listingId}`); onClose(); }}
                        >
                        Edit
                      </button>
                      <button
                          className="btn-chat"
                          style={{ backgroundColor: "#2ecc71", flex: 1 }} 
                          onClick={() => setShowMarkSoldModal(true)}
                        >
                        Mark as Sold
                      </button>
                    </div>
                   </>
                )}
              </>

            ) : (
              /* 2. VISITOR VIEW */
              <>
                <div className="seller-info-header">
                  <img
                    src={
                      seller.avatarUrl 
                        ? (seller.avatarUrl.startsWith('http') ? seller.avatarUrl : `http://localhost:8080${seller.avatarUrl}`)
                        : defaultAvatar
                    }
                    alt="Seller Avatar"
                    className="seller-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                  />
                  <div className="seller-details">
                    <div className="seller-username">
                        <Link to={`/profile/${seller.id}`} onClick={onClose} className="seller-link">
                            {seller.username}
                        </Link>
                    </div>
                      <UserRatingDisplay 
                          userId={seller.id} 
                          initialData={sellerRatingInitialData} 
                      />
                  </div>
                </div>

                <div className="action-note">
                    {isSold ? 'This item has been sold.' : typeText}
                </div>

                {/* Only show chat button if item is NOT sold */}
                {!isSold && (
                    <button 
                      className="btn-chat" 
                      onClick={handleChatClick}
                      disabled={isStartingChat} 
                    >
                      {isStartingChat ? 'Starting Chat...' : 'Chat with the Seller'}
                    </button>
                )}
              </>
            )}
          </div>

        </section>
      </div>

      {/* --- Nested Modal: Mark as Sold Confirmation --- */}
      {showMarkSoldModal && (
        <MarkAsSoldModal 
          listing={listing}
          currentUser={{ userId: currentUserId }}
          onClose={() => setShowMarkSoldModal(false)}
          onSuccess={() => {
            setShowMarkSoldModal(false);
            onClose(); // Close parent modal
            window.location.reload(); // Refresh to update status
          }}
        />
      )}
    </div>
  );
}
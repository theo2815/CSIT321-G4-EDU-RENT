import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { startConversation } from '../services/apiService'; 
import MarkAsSoldModal from './MarkAsSoldModal';
import ReviewModal from './ReviewModal';
import UserRatingDisplay from './UserRatingDisplay';

// Hook for the Login/Register Modals
import { useAuthModal } from '../context/AuthModalContext';

// Styles and Assets
import '../static/ProductDetailModal.css';
import '../static/ProfilePage.css';
import '../static/DashboardPage.css';
import defaultAvatar from '../assets/default-avatar.png'; 

// Helper to ensure the UI doesn't crash if user data is incomplete
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

export default function ProductDetailModal({ 
  listing, 
  onClose, 
  currentUserId, 
  isLiked, 
  onLikeClick, 
  isLiking, 
  sellerRatingInitialData,
  initialContext 
}) {
  const navigate = useNavigate();
  const { openLogin } = useAuthModal(); 

  // Local state for modals and chat loading status
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false); 

  if (!listing) return null;

  // Determine the status and ownership of the item
  const isSold = listing.status === 'Sold';
  const isOwner = currentUserId && currentUserId === listing?.user?.userId;
  const seller = getSellerInfo(listing.user);

  const priceDisplay = `₱${(listing.price || 0).toFixed(2)}`;
  
  // --- Optimistic Like Count ---
  // We calculate the like count on the client side to give immediate visual feedback 
  // to the user while the server processes the request in the background.
  const serverLikeCount = listing.likes ? listing.likes.length : 0;
  
  const wasLikedInitial = useMemo(() => {
    if (!listing.likes || !currentUserId) return false;
    return listing.likes.some(like => like.id?.userId === currentUserId);
  }, [listing.likes, currentUserId]);

  let displayLikeCount = serverLikeCount;
  if (isLiked && !wasLikedInitial) displayLikeCount++;
  else if (!isLiked && wasLikedInitial) displayLikeCount--;
  displayLikeCount = Math.max(0, displayLikeCount);

  // --- Image Handling ---
  const rawImages = listing.listingImages || listing.images || [];
  const images = Array.isArray(rawImages) ? rawImages.map(img => img.imageUrl) : [];

  // Default to the cover photo, otherwise fall back to the first image
  const initialImageIndex = Math.max(0, images.findIndex(img => 
      rawImages.find(li => li.imageUrl === img)?.isCoverPhoto 
  ));

  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const showArrows = images.length > 1;
  const currentImageUrl = images[currentImageIndex] || 'https://via.placeholder.com/400x400?text=No+Image';

  // Ensure image URLs are absolute paths for localhost or production
  const getFullImageUrl = (path) => {
      if (!path) return 'https://via.placeholder.com/400x400?text=No+Image';
      return path.startsWith('http') ? path : `http://localhost:8080${path}`;
  };

  // --- Context Logic ---
  // We check `initialContext` to determine the relationship between the user and this item
  // (e.g., Are they the buyer? Is there an existing chat? Have they left a review?)
  const chatCount = initialContext?.chatCount || 0;
  const existingChat = initialContext?.existingChat;
  const isBuyerOfSoldItem = isSold && existingChat && existingChat.transactionId;
  const hasAlreadyReviewed = existingChat?.hasReviewed;

  // --- Handlers ---

  const handlePrevImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1); };
  const handleNextImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1); };
  
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  const handleLikeClick = (e) => {
    e.stopPropagation(); 
    // Force login if a guest tries to like an item
    if (!currentUserId) {
        openLogin();
        return;
    }
    if (onLikeClick) onLikeClick(listing.listingId);
  };

  const handleViewChats = () => {
    navigate('/messages', { state: { filterByListingId: listing.listingId } });
    onClose();
  };

  const handleReviewClick = () => {
    if (hasAlreadyReviewed) {
        // If reviewed, redirect to seller profile to view it
        navigate(`/profile/${seller.id}`); 
        onClose();
    } else {
        setShowReviewModal(true);
    }
  };

  // Handles initiating a new chat or resuming an old one
  const handleChatClick = async () => {
    if (!currentUserId) {
        openLogin();
        return;
    }

    // If chat exists, resume it directly
    if (existingChat) {
        navigate('/messages', { 
            state: { 
                openConversation: existingChat,
                openConversationId: existingChat.conversationId 
            } 
        });
        onClose();
        return;
    }

    // Otherwise, create a new chat session
    const sellerId = listing?.user?.userId;
    if (!sellerId) return;

    // Optimistic navigation to make the app feel faster
    navigate('/messages', { 
        state: { 
            initiateChat: {
                listingId: listing.listingId,
                sellerId: sellerId
            }
        } 
    });
    onClose();

    try {
        const response = await startConversation(listing.listingId, currentUserId, sellerId);
        const fullConversation = response.data;
        // Update navigation state with the confirmed conversation ID
        navigate('/messages', { 
            state: { 
                openConversation: fullConversation,
                openConversationId: fullConversation.conversationId 
            } 
        });
    } catch (error) {
        console.error("Failed to start conversation:", error);
    }
  };

  return (
    <div className="modal-overlay visible" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="product-modal-content">

        {/* --- Left Column: Image Gallery --- */}
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

        {/* --- Right Column: Item Details --- */}
        <section className="product-details-section">
          <button onClick={onClose} className="product-modal-close-btn" aria-label="Close modal">&times;</button>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h2 className="product-info-name" style={{ margin: 0 }}>
                {listing.title || 'No Title'}
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
              
              {/* Like Button */}
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
                  <span style={{ fontWeight: 'bold', color: '#495057' }}>{displayLikeCount}</span>
              </div>
            </div>

            <p className="product-info-price">{priceDisplay}</p>
            
            {/* --- Deal Methods (Merged from Modified Code) --- */}
            <div className="product-info-block">
              <span className="product-info-label">Deal Method:</span>
              <div className="product-info-value">
                
                {/* 1. Meet-up Option */}
                {listing.allowMeetup && (
                    <div style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>📌</span>
                        <div>
                            <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>Meet-up</span>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Location: {listing.meetupLocation || 'Not specified'}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Delivery Option */}
                {listing.allowDelivery && (
                    <div style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>🚚</span>
                        <div>
                            <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>Delivery</span>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                via {listing.deliveryOptions || 'Courier'}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Fallback */}
                {!listing.allowMeetup && !listing.allowDelivery && (
                    <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No deal method specified</span>
                )}
              </div>
            </div>
            {/* --- End Deal Methods --- */}

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

          {/* --- Seller Info & Action Buttons --- */}
          <div className="seller-info-section">
            
            {/* VIEW 1: I AM THE OWNER */}
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

                {/* Owner: View Chats (if any exist) */}
                {chatCount > 0 && (
                    <button 
                        className="btn-chat" 
                        style={{ backgroundColor: "#0077B6", marginBottom: '0.5rem' }}
                        onClick={handleViewChats}
                    >
                        View {chatCount} Chat{chatCount !== 1 ? 's' : ''}
                    </button>
                )}

                {/* Owner: Status Actions */}
                {isSold ? (
                  <div className="action-note" style={{ color: '#e53935', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    Item marked as Sold
                  </div>
                ) : (
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
                )}
              </>

            ) : (
              /* VIEW 2: I AM A BUYER / VISITOR */
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

                {/* Buyer Actions */}
                {isSold ? (
                    isBuyerOfSoldItem ? (
                        /* Scenario A: It was sold to ME -> Show Review Options */
                        <>
                            <div className="action-note" style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                                SOLD TO YOU
                            </div>
                            <button 
                                className="btn-chat" 
                                style={{ 
                                    backgroundColor: hasAlreadyReviewed ? "#2ecc71" : "#f1c40f", 
                                    color: hasAlreadyReviewed ? "white" : "#333" 
                                }} 
                                onClick={handleReviewClick}
                            >
                                {hasAlreadyReviewed 
                                    ? "✓ SOLD TO YOU – You already reviewed this" 
                                    : "⭐ Leave a Review"
                                }
                            </button>
                        </>
                    ) : (
                        /* Scenario B: Sold to someone else -> Show Disabled State */
                        <button className="btn-chat" disabled style={{ backgroundColor: "#e0e0e0", color: "#888", cursor: "not-allowed" }}>
                            This item is already sold
                        </button>
                    )
                ) : (
                    /* Scenario C: Available -> Allow Chat */
                    <button 
                      className="btn-chat" 
                      onClick={handleChatClick} 
                      disabled={isStartingChat}
                    >
                      {existingChat ? 'View Existing Chat' : 'Chat with the Seller'}
                    </button>
                )}
              </>
            )}
          </div>

        </section>
      </div>

      {/* --- Modals --- */}
      {showMarkSoldModal && (
        <MarkAsSoldModal 
          listing={listing}
          currentUser={{ userId: currentUserId }}
          onClose={() => setShowMarkSoldModal(false)}
          onSuccess={() => {
            setShowMarkSoldModal(false);
            onClose(); 
            window.location.reload(); 
          }}
        />
      )}

      {showReviewModal && existingChat && (
          <div style={{ position: 'absolute', zIndex: 1100 }}>
            <ReviewModal 
                transactionId={existingChat.transactionId}
                reviewerId={currentUserId}
                otherUserName={seller.username}
                onClose={() => setShowReviewModal(false)}
                onSuccess={() => {
                    alert("Review submitted!");
                    setShowReviewModal(false);
                }}
            />
          </div>
      )}

    </div>
  );
}
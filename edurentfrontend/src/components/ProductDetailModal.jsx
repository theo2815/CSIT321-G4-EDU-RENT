import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Merged API imports to include rental management functions
import { startConversation, getTransactionByListing, updateRentalDates, returnRental } from '../services/apiService'; 
import MarkAsSoldModal from './MarkAsSoldModal';
import ReviewModal from './ReviewModal';
import UserRatingDisplay from './UserRatingDisplay';

import { useAuthModal } from '../context/AuthModalContext';

// New Feedback Hooks
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmationContext';

import '../static/ProductDetailModal.css';
import '../static/ProfilePage.css';
import '../static/DashboardPage.css';
import defaultAvatar from '../assets/default-avatar.png'; 

// --- Sub-Component: Edit Rental Dates Modal ---
// This handles the specific logic for updating the start/end dates of an active transaction
function EditRentalDatesModal({ transaction, onClose, onSuccess }) {
  // Initialize state with existing dates (formatted for input type="date")
  const [startDate, setStartDate] = useState(transaction.startDate ? transaction.startDate.split('T')[0] : '');
  const [endDate, setEndDate] = useState(transaction.endDate ? transaction.endDate.split('T')[0] : '');
  const [loading, setLoading] = useState(false);

  // Use toast for feedback inside this sub-component
  const { showSuccess, showError } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateRentalDates(transaction.transactionId, startDate, endDate);
      showSuccess("Rental dates updated successfully!");
      onSuccess();
    } catch (error) {
      console.error("Update failed:", error);
      showError("Failed to update dates. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay visible" style={{ zIndex: 1200 }}>
       <div className="mark-sold-modal-content">
          <div className="modal-header">
             <h3 className="modal-title">Edit Rental Period</h3>
             <button onClick={onClose} className="modal-close-btn">&times;</button>
          </div>
          <div className="mark-sold-body">
             <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                   <label className="auth-label">Start Date</label>
                   <input type="date" className="auth-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                   <label className="auth-label">End Date</label>
                   <input type="date" className="auth-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
             </div>
          </div>
          <div className="modal-footer">
             <button className="btn btn-primary-accent" onClick={handleSave} disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Saving...' : 'Save Changes'}
             </button>
          </div>
       </div>
    </div>
  );
}

const getSellerInfo = (listingUser) => {
  const defaultUser = { userId: null, fullName: 'Seller Unknown', profilePictureUrl: null, school: { name: 'N/A' } };
  const user = listingUser || defaultUser;
  return {
    id: user.userId,
    username: user.fullName || 'Seller Unknown',
    avatarUrl: user.profilePictureUrl || null,
    school: user.school?.name || 'N/A',
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
  initialContext,
  initialAction
}) {
  const navigate = useNavigate();
  const { openLogin } = useAuthModal(); 
  
  // Feedback hooks
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();

  // Local state for modals and chat
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false); 
  
  // New state for managing active rental transactions
  const [showEditDatesModal, setShowEditDatesModal] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState(null);

  if (!listing) return null;

  // Status checks
  const isSold = listing.status === 'Sold';
  const isRented = listing.status === 'Rented';
  const isOwner = currentUserId && currentUserId === listing?.user?.userId;
  const seller = getSellerInfo(listing.user);

  const isRentType = listing.listingType?.toUpperCase().includes('RENT');
  const priceDisplay = `₱${(listing.price || 0).toFixed(2)}`;

  // --- Fetch Active Transaction Logic ---
  useEffect(() => {
    // Fetch transaction if Rented OR if Owner needs to see Sold info (for reviews)
    if (isRented || (isSold && isOwner)) {
        getTransactionByListing(listing.listingId)
            .then(res => {
                const transaction = res.data;
                setActiveTransaction(transaction);
                
                // Check if current user has already reviewed
                const userHasReviewed = res.data.reviews?.some(
                    r => r.reviewer?.userId === currentUserId || r.reviewer?.id === currentUserId
                );

                // Auto-open review modal ONLY if NOT reviewed yet
                if (initialAction === 'review' && isOwner && !userHasReviewed) {
                    setShowReviewModal(true);
                }
            })
            .catch(err => console.error("Could not load transaction info:", err));
    }
  }, [isRented, isSold, isOwner, listing.listingId, initialAction, currentUserId, showSuccess]);

  // Helper to format dates strictly as MM/DD/YYYY without timezone shifts
  const formatRentalDate = (dateString) => {
      if (!dateString) return '...';
      return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: 'UTC'
      });
  };

  // --- Handlers ---

  // Handles marking a rented item as returned (making it available again)
  const handleReturnItem = async () => {
      if (!activeTransaction) return;
      
      // Replaced window.confirm with custom confirm modal.
      // Since confirm() returns a Promise, we await the user's decision.
      const isConfirmed = await confirm({
        title: "Return Item?",
        message: "Mark this item as returned? It will become 'Available' immediately.",
        confirmText: "Yes, Return it",
        isDangerous: false
      });

      if (isConfirmed) {
          try {
              await returnRental(activeTransaction.transactionId);
              showSuccess("Item marked as returned successfully.");
              onClose();
              window.location.reload(); 
          } catch (error) {
              showError("Failed to return item. Please try again. ",error);
          }
      }
  };

  // Optimistic Like Count
  const serverLikeCount = listing.likes ? listing.likes.length : 0;
  const wasLikedInitial = useMemo(() => {
    if (!listing.likes || !currentUserId) return false;
    return listing.likes.some(like => like.id?.userId === currentUserId);
  }, [listing.likes, currentUserId]);

  let displayLikeCount = serverLikeCount;
  if (!isSold) {
    if (isLiked && !wasLikedInitial) displayLikeCount++;
    else if (!isLiked && wasLikedInitial) displayLikeCount--;
  }
  displayLikeCount = Math.max(0, displayLikeCount);

  // Image Logic
  const rawImages = listing.listingImages || listing.images || [];
  const images = Array.isArray(rawImages) ? rawImages.map(img => img.imageUrl) : [];
  const initialImageIndex = Math.max(0, images.findIndex(img => 
      rawImages.find(li => li.imageUrl === img)?.isCoverPhoto 
  ));

  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const showArrows = images.length > 1;
  const currentImageUrl = images[currentImageIndex] || 'https://via.placeholder.com/400x400?text=No+Image';

  const getFullImageUrl = (path) => {
      if (!path) return 'https://via.placeholder.com/400x400?text=No+Image';
      return path.startsWith('http') ? path : `http://localhost:8080${path}`;
  };

  const chatCount = initialContext?.chatCount || 0;
  const existingChat = initialContext?.existingChat;
  
  // Transaction Participant Logic
  const isTransactionParticipant = existingChat && existingChat.transactionId;
  const isBuyerOfSoldItem = isSold && isTransactionParticipant;
  const isRenter = isRented && isTransactionParticipant;
  const hasAlreadyReviewed = existingChat?.hasReviewed;

  const handlePrevImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1); };
  const handleNextImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1); };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  const handleLikeClick = (e) => {
    e.stopPropagation(); 
    if (!currentUserId) { openLogin(); return; }
    if (onLikeClick) onLikeClick(listing.listingId);
  };

  const handleViewChats = () => {
    navigate('/messages', { state: { filterByListingId: listing.listingId } });
    onClose();
  };

  const handleReviewClick = () => {
    if (hasAlreadyReviewed) {
        navigate(`/profile/${seller.id}`); 
        onClose();
    } else {
        setShowReviewModal(true);
    }
  };

  const handleChatClick = async () => {
    if (!currentUserId) { openLogin(); return; }

    if (existingChat) {
        navigate('/messages', { state: { openConversation: existingChat, openConversationId: existingChat.conversationId } });
        onClose();
        return;
    }

    const sellerId = listing?.user?.userId;
    if (!sellerId) return;

    navigate('/messages', { state: { initiateChat: { listingId: listing.listingId, sellerId: sellerId } } });
    onClose();

    try {
        const response = await startConversation(listing.listingId, currentUserId, sellerId);
        const fullConversation = response.data;
        navigate('/messages', { state: { openConversation: fullConversation, openConversationId: fullConversation.conversationId } });
    } catch (error) {
        console.error("Failed to start conversation:", error);
        showError("Could not start conversation. Please try again.");
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
                  <span style={{ color: '#e53935', fontSize: '0.6em', marginLeft: '10px', verticalAlign: 'middle', border: '1px solid #e53935', padding: '2px 6px', borderRadius: '4px' }}>SOLD</span>
                )}
                {isRented && (
                  <span style={{ color: '#2ecc71', fontSize: '0.6em', marginLeft: '10px', verticalAlign: 'middle', border: '1px solid #2ecc71', padding: '2px 6px', borderRadius: '4px' }}>RENTED</span>
                )}
              </h2>
              
              <div 
                  onClick={(!isOwner && !isSold) ? handleLikeClick : undefined}
                  style={{ 
                      display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f3f5', padding: '6px 12px',
                      borderRadius: '20px', cursor: (!isOwner && !isSold) ? 'pointer' : 'default',
                      flexShrink: 0, opacity: isSold ? 0.7 : 1
                  }}
                  title={isOwner ? `${displayLikeCount} people liked this` : (isSold ? 'Item is sold' : (isLiked ? 'Unlike' : 'Like'))}
              >
                  <span style={{ fontSize: '1.2rem', lineHeight: 1, color: isOwner ? '#6c757d' : (isLiked ? '#e53935' : '#ccc') }}>
                      {isLiking ? '...' : (isOwner ? '🖤' : (isLiked ? '❤️' : '🤍'))}
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#495057' }}>{displayLikeCount}</span>
              </div>
            </div>

            {/* Viewer View: Clean Date Display (Hidden for Owner) */}
            {isRented && activeTransaction && !isOwner && (
                <div style={{ 
                    marginBottom: '1rem', 
                    padding: '0.5rem 0', 
                    borderTop: '1px solid #eee', 
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    fontSize: '0.9rem',
                    color: '#555'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Start Date:</span>
                        <strong style={{ color: '#2ecc71' }}>{formatRentalDate(activeTransaction.startDate)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>End Date:</span>
                        <strong style={{ color: '#e53935' }}>{formatRentalDate(activeTransaction.endDate)}</strong>
                    </div>
                </div>
            )}

            <p className="product-info-price">{priceDisplay}</p>
            
            {/* Deal Methods */}
            <div className="product-info-block">
              <span className="product-info-label">Deal Method:</span>
              <div className="product-info-value">
                {listing.allowMeetup && (
                    <div style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>📌</span>
                        <div>
                            <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>Meet-up</span>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Location: {listing.meetupLocation || 'Not specified'}</div>
                        </div>
                    </div>
                )}
                {listing.allowDelivery && (
                    <div style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>🚚</span>
                        <div>
                            <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>Delivery</span>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>via {listing.deliveryOptions || 'Courier'}</div>
                        </div>
                    </div>
                )}
                {!listing.allowMeetup && !listing.allowDelivery && (
                    <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No deal method specified</span>
                )}
              </div>
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

          {/* --- Seller Info & Action Buttons --- */}
          <div className="seller-info-section">
            
            {/* VIEW 1: OWNER */}
            {isOwner ? (
              <>
                <div className="seller-info-header">
                  <img src={seller.avatarUrl ? (seller.avatarUrl.startsWith('http') ? seller.avatarUrl : `http://localhost:8080${seller.avatarUrl}`) : defaultAvatar} alt="Seller Avatar" className="seller-avatar" onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }} />
                  <div className="seller-details">
                    <div className="seller-username">{seller.username} (You)</div>
                    <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '2px' }}>{seller.school}</div>
                    <UserRatingDisplay userId={currentUserId} initialData={sellerRatingInitialData} />
                  </div>
                </div>

                {chatCount > 0 && (
                    <button className="btn-chat" style={{ backgroundColor: "#0077B6", marginBottom: '0.5rem' }} onClick={handleViewChats}>
                        View {chatCount} Chat{chatCount !== 1 ? 's' : ''}
                    </button>
                )}

                {/* Owner Status Actions */}
                {isSold ? (
                  <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                      <div className="action-note" style={{ color: '#e53935', fontWeight: 'bold' }}>
                        Item marked as Sold
                      </div>
                      {/* Allow Seller to Review Buyer */}
                      {activeTransaction && (() => {
                          const userHasReviewed = activeTransaction.reviews?.some(
                              r => r.reviewer?.userId === currentUserId || r.reviewer?.id === currentUserId
                          );
                          
                          if (userHasReviewed) {
                              return (
                                  <div style={{ 
                                      marginTop: '0.75rem', 
                                      color: '#2ecc71', 
                                      fontWeight: '600', 
                                      fontSize: '0.9rem',
                                      padding: '0.5rem',
                                      backgroundColor: '#f0fdf4',
                                      borderRadius: '8px',
                                      border: '1px solid #bbf7d0'
                                  }}>
                                      ✓ You already reviewed this buyer
                                  </div>
                              );
                          }

                          return (
                              <button 
                                  className="btn-chat" 
                                  style={{ 
                                      marginTop: '0.5rem', 
                                      backgroundColor: "#f1c40f", 
                                      color: "#333",
                                      fontSize: '0.9rem'
                                  }}
                                  onClick={() => setShowReviewModal(true)}
                              >
                                  ⭐ Review Buyer
                              </button>
                          );
                      })()}
                  </div>
                ) : isRented ? (
                   // --- Rented Controls: Edit Dates or Return ---
                   <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                           <span style={{ fontWeight: 'bold', color: '#0284c7' }}>Item is Rented</span>
                           <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                               {activeTransaction ? `${formatRentalDate(activeTransaction.startDate)} - ${formatRentalDate(activeTransaction.endDate)}` : 'Loading...'}
                           </span>
                       </div>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                           <button
                               className="btn-chat" 
                               style={{ backgroundColor: "#ffffff", color: "#0284c7", border: "1px solid #0284c7", flex: 1, fontSize: '0.85rem' }} 
                               onClick={() => setShowEditDatesModal(true)}
                               disabled={!activeTransaction}
                           >
                               Edit Dates
                           </button>
                           <button 
                               className="btn-chat" 
                               style={{ backgroundColor: "#e53935", flex: 1, fontSize: '0.85rem' }} 
                               onClick={handleReturnItem}
                               disabled={!activeTransaction}
                           >
                               Mark Returned
                           </button>
                       </div>
                   </div>
                ) : (
                   // --- Available Controls ---
                   <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button className="btn-chat" style={{ backgroundColor: "var(--text-muted)", flex: 1 }} onClick={() => { navigate(`/edit-listing/${listing.listingId}`); onClose(); }}>
                        Edit
                      </button>
                      <button className="btn-chat" style={{ backgroundColor: "#2ecc71", flex: 1 }} onClick={() => setShowMarkSoldModal(true)}>
                        {isRentType ? 'Mark as Rented' : 'Mark as Sold'}
                      </button>
                   </div>
                )}
              </>

            ) : (
              /* VIEW 2: BUYER / VISITOR */
              <>
                <div className="seller-info-header">
                  <img src={seller.avatarUrl ? (seller.avatarUrl.startsWith('http') ? seller.avatarUrl : `http://localhost:8080${seller.avatarUrl}`) : defaultAvatar} alt="Seller Avatar" className="seller-avatar" onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }} />
                  <div className="seller-details">
                    <div className="seller-username">
                        <Link to={`/profile/${seller.id}`} onClick={onClose} className="seller-link">{seller.username}</Link>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '2px' }}>{seller.school}</div>
                      <UserRatingDisplay userId={seller.id} initialData={sellerRatingInitialData} />
                  </div>
                </div>

                {isSold && (
                    isBuyerOfSoldItem ? (
                        <>
                            <div className="action-note" style={{ color: '#2ecc71', fontWeight: 'bold' }}>SOLD TO YOU</div>
                            <button 
                                className="btn-chat" 
                                style={{ backgroundColor: hasAlreadyReviewed ? "#2ecc71" : "#f1c40f", color: hasAlreadyReviewed ? "white" : "#333" }} 
                                onClick={handleReviewClick}
                            >
                                {hasAlreadyReviewed ? "✓ SOLD TO YOU – You already reviewed this" : "⭐ Leave a Review"}
                            </button>
                        </>
                    ) : (
                        <button className="btn-chat" disabled style={{ backgroundColor: "#e0e0e0", color: "#888", cursor: "not-allowed" }}>
                            This item is already sold
                        </button>
                    )
                )}

                {isRented && (
                    isRenter ? (
                        <>
                            <div className="action-note" style={{ color: '#2ecc71', fontWeight: 'bold' }}>RENTED TO YOU</div>
                            <button 
                                className="btn-chat" 
                                style={{ backgroundColor: hasAlreadyReviewed ? "#2ecc71" : "#f1c40f", color: hasAlreadyReviewed ? "white" : "#333" }} 
                                onClick={handleReviewClick}
                            >
                                {hasAlreadyReviewed ? "✓ RENTED TO YOU – You already reviewed this" : "⭐ Leave a Review"}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="action-note" style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>Want this item?</div>
                            <button className="btn-chat" onClick={handleChatClick}>Chat with seller to reserve!</button>
                        </>
                    )
                )}

                {!isSold && !isRented && (
                    <button className="btn-chat" onClick={handleChatClick} disabled={isStartingChat}>
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

      {showReviewModal && (existingChat || activeTransaction) && (
          <div style={{ position: 'absolute', zIndex: 1100 }}>
            <ReviewModal 
                transactionId={existingChat?.transactionId || activeTransaction?.transactionId}
                reviewerId={currentUserId}
                // If owner: reviewing buyer. If buyer: reviewing seller.
                otherUserName={isOwner ? (activeTransaction?.buyer?.fullName || 'Buyer') : seller.username}
                onClose={() => setShowReviewModal(false)}
                onSuccess={() => {
                    setShowReviewModal(false);
                    window.location.reload();
                }}
            />
          </div>
      )}

      {/* --- NEW: Render Edit Dates Modal --- */}
      {showEditDatesModal && activeTransaction && (
          <EditRentalDatesModal 
              transaction={activeTransaction}
              onClose={() => setShowEditDatesModal(false)}
              onSuccess={() => {
                  setShowEditDatesModal(false);
                  // Refresh transaction data instantly
                  getTransactionByListing(listing.listingId).then(res => setActiveTransaction(res.data));
              }}
          />
      )}

    </div>
  );
}
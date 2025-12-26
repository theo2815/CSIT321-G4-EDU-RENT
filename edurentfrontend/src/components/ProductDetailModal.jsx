import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Merged API imports to include rental management functions
import { startConversation, getTransactionByListing, updateRentalDates, returnRental } from '../services/apiService'; 
import MarkAsSoldModal from './MarkAsSoldModal';
import ReviewModal from './ReviewModal';
import UserRatingDisplay from './UserRatingDisplay';
import LoadingOverlay from './LoadingOverlay';
import LoadingDots from './LoadingDots';

import { useAuthModal } from '../context/AuthModalContext';

// New Feedback Hooks
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmationContext';

import '../static/ProductDetailModal.css';
import '../static/ProfilePage.css';
import '../static/DashboardPage.css';
import defaultAvatar from '../assets/default-avatar.png'; 
import SocialIcon from './SocialIcon'; 

// --- Sub-Component: Edit Rental Dates Modal ---
// This handles the specific logic for updating the start/end dates of an active transaction
function EditRentalDatesModal({ transaction, onClose, onSuccess }) {
  // Helper to get local date string for 'min' attribute
  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  // Initialize state with existing dates (formatted for input type="date")
  const [startDate, setStartDate] = useState(transaction.startDate ? transaction.startDate.split('T')[0] : '');
  const [endDate, setEndDate] = useState(transaction.endDate ? transaction.endDate.split('T')[0] : '');
  const [loading, setLoading] = useState(false);

  // Use toast for feedback inside this sub-component
  const { showSuccess, showError, showWarning } = useToast();
  const today = getTodayDate();

  const handleSave = async () => {
    // VALIDATION 
    if (!startDate || !endDate) {
        showWarning("Please select both start and end dates.");
        return;
    }
    if (startDate < today) {
        showWarning("Start date cannot be in the past.");
        return;
    }
    if (endDate < startDate) {
        showWarning("End date cannot be before the start date.");
        return;
    }

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
                   <input 
                     type="date" 
                     className="auth-input" 
                     value={startDate} 
                     min={today}
                     onChange={e => {
                        setStartDate(e.target.value);
                        // Auto-adjust end date if it becomes invalid
                        if (endDate && e.target.value > endDate) {
                            setEndDate(e.target.value);
                        }
                     }} 
                   />
                </div>
                <div>
                   <label className="auth-label">End Date</label>
                   <input 
                     type="date" 
                     className="auth-input" 
                     value={endDate} 
                     min={startDate || today}
                     onChange={e => setEndDate(e.target.value)} 
                   />
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
    profileSlug: user.profileSlug || user.userId, // Use profileSlug for URL, fallback to userId
    avatarUrl: user.profilePictureUrl || null,
    school: user.school?.name || user.schoolName || 'N/A',
    reviewCount: 'N/A', 
    ratingAvg: 'N/A',
    facebookUrl: user.facebookUrl || null,
    instagramUrl: user.instagramUrl || null,
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
  initialAction,
  isLoadingContext
}) {
  const navigate = useNavigate();
  const { openLogin } = useAuthModal(); 
  
  // Feedback hooks
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();

  // Local state for modals
  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false); 
  
  // Local listing state to support live updates without page reload
  const [currentListing, setCurrentListing] = useState(listing);

  // Update local state if prop changes (e.g. parent re-renders)
  useEffect(() => {
    setCurrentListing(listing);
  }, [listing]); 
  
  // New state for managing active rental transactions
  const [showEditDatesModal, setShowEditDatesModal] = useState(false);
  // OPTIMIZATION: Initialize from pre-fetched transaction data instead of separate fetch
  const [activeTransaction, setActiveTransaction] = useState(initialContext?.transaction || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingTransaction, setIsFetchingTransaction] = useState(false);
  // Track if we've already attempted to fetch transaction (prevents infinite loop on 401)
  const transactionFetchAttempted = React.useRef(false);

  // Status checks using local state
  const isSold = currentListing.status === 'Sold';
  const isRented = currentListing.status === 'Rented';
  const isOwner = currentUserId && currentUserId === currentListing?.user?.userId;
  // Check if current user is the buyer/renter of this transaction
  const isBuyer = currentUserId && activeTransaction?.buyer?.userId === currentUserId;
  // Memoized seller info to avoid recalculating on every render
  const seller = useMemo(() => getSellerInfo(currentListing.user), [currentListing.user]);

  const isRentType = currentListing.listingType?.toUpperCase().includes('RENT');
  const priceDisplay = `₱${(currentListing.price || 0).toFixed(2)}`;

  // Helper to fetch transaction data (used for MANUAL refresh after user actions)
  const fetchActiveTransaction = () => {
      // Fetch transaction for Rented items, or Sold items (for both owner reviews and buyer identification)
      const shouldFetch = currentListing.status === 'Rented' || currentListing.status === 'Sold';

      if (shouldFetch) {
        setIsFetchingTransaction(true);
        getTransactionByListing(currentListing.listingId)
            .then(res => {
                setActiveTransaction(res.data);
            })
            .catch(err => console.error("Could not load transaction info:", err))
            .finally(() => setIsFetchingTransaction(false));
      }
  };

  // OPTIMIZATION: Only sync transaction from initialContext on mount or context change
  // This replaces the expensive useEffect that had many dependencies
  useEffect(() => {
    if (initialContext?.transaction) {
      setActiveTransaction(initialContext.transaction);
      transactionFetchAttempted.current = true; // Mark as fetched since we got it from context
      
      // Check if we should auto-open review modal
      const userHasReviewed = initialContext.transaction.reviews?.some(
        r => r.reviewer?.userId === currentUserId || r.reviewer?.id === currentUserId
      );
      if (initialAction === 'review' && isOwner && !userHasReviewed) {
        setShowReviewModal(true);
      }
    }
  }, [initialContext?.transaction, initialAction, isOwner, currentUserId]);

  // NEW: Fetch transaction on mount for sold/rented items to identify buyer/renter
  // Only attempt ONCE to prevent infinite loop when API returns 401 for guests
  useEffect(() => {
    const shouldFetch = (currentListing.status === 'Sold' || currentListing.status === 'Rented') 
                        && !activeTransaction 
                        && !isFetchingTransaction
                        && !transactionFetchAttempted.current;
    
    if (shouldFetch && currentListing.listingId) {
      transactionFetchAttempted.current = true; // Mark as attempted BEFORE fetching
      setIsFetchingTransaction(true);
      getTransactionByListing(currentListing.listingId)
        .then(res => {
          setActiveTransaction(res.data);
        })
        .catch(err => {
          // Expected for guests (401 Unauthorized) - just log and stop, don't retry
          console.error("Could not load transaction info:", err);
        })
        .finally(() => setIsFetchingTransaction(false));
    }
  }, [currentListing.listingId, currentListing.status]); // Removed activeTransaction and isFetchingTransaction to prevent re-triggers

  // Helper to format dates using local time to avoid shifts
  const formatRentalDate = (dateString) => {
      if (!dateString) return '...';
      return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short', // Changed to short for better readability (e.g. Dec 10, 2025)
          day: 'numeric'
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
              setIsProcessing(true);
              await returnRental(activeTransaction.transactionId);
              showSuccess("Item marked as returned successfully.");
              
              // Local update instead of reload
              setCurrentListing(prev => ({ ...prev, status: 'Available' }));
              setActiveTransaction(null); // Clear transaction as it's closed/returned
              // onClose(); // Optional: keep modal open to show updated status? User usually wants to verify.
              // Let's keep modal open but updated.
          } catch (error) {
              showError("Failed to return item. Please try again. ",error);
          } finally {
              setIsProcessing(false);
          }
      }
  };



  // Optimistic Like Count
  const serverLikeCount = currentListing.likes ? currentListing.likes.length : 0;
  const wasLikedInitial = useMemo(() => {
    if (!currentListing.likes || !currentUserId) return false;
    return currentListing.likes.some(like => like.id?.userId === currentUserId);
  }, [currentListing.likes, currentUserId]);

  let displayLikeCount = serverLikeCount;
  if (!isSold) {
    if (isLiked && !wasLikedInitial) displayLikeCount++;
    else if (!isLiked && wasLikedInitial) displayLikeCount--;
  }
  displayLikeCount = Math.max(0, displayLikeCount);

  // Image Logic
  const rawImages = currentListing.listingImages || currentListing.images || [];
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
  


  const handlePrevImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1); };
  const handleNextImage = (e) => { e.stopPropagation(); setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1); };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  const handleLikeClick = (e) => {
    e.stopPropagation(); 
    if (!currentUserId) { openLogin(); return; }
    if (onLikeClick) onLikeClick(currentListing.listingId);
  };

  const handleViewChats = () => {
    navigate('/messages', { state: { filterByListingId: currentListing.listingId } });
    onClose();
  };



  const handleChatClick = async () => {
    if (!currentUserId) { openLogin(); return; }

    if (existingChat) {
        // Pass preferredFilter to open the correct tab for sold/rented items
        const filter = (isSold || isRented) ? 'Sold' : undefined;
        navigate('/messages', { 
            state: { 
                openConversation: existingChat, 
                openConversationId: existingChat.conversationId,
                preferredFilter: filter
            } 
        });
        onClose();
        return;
    }

    const sellerId = listing?.user?.userId;
    if (!sellerId) return;

    navigate('/messages', { state: { initiateChat: { listingId: currentListing.listingId, sellerId: sellerId } } });
    onClose();

    try {
        const response = await startConversation(currentListing.listingId, currentUserId, sellerId);
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
            alt={`${currentListing.title || 'Listing'} - Image ${currentImageIndex + 1}`}
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
                {currentListing.title || 'No Title'}
                {isSold && (
                  <span style={{ color: '#e53935', fontSize: '0.6em', marginLeft: '10px', verticalAlign: 'middle', border: '1px solid #e53935', padding: '2px 6px', borderRadius: '4px' }}>SOLD</span>
                )}
                {isRented && (
                  <span style={{ color: '#2ecc71', fontSize: '0.6em', marginLeft: '10px', verticalAlign: 'middle', border: '1px solid #2ecc71', padding: '2px 6px', borderRadius: '4px' }}>RENTED</span>
                )}
              </h2>
              
              <div 
                  onClick={(!isOwner && !isSold && !isLoadingContext) ? handleLikeClick : undefined}
                  style={{ 
                      display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f3f5', padding: '6px 12px',
                      borderRadius: '20px', cursor: (!isOwner && !isSold && !isLoadingContext) ? 'pointer' : 'default',
                      flexShrink: 0, opacity: (isSold || isLoadingContext) ? 0.7 : 1
                  }}
                  title={isLoadingContext ? 'Loading...' : (isOwner ? `${displayLikeCount} people liked this` : (isSold ? 'Item is sold' : (isLiked ? 'Unlike' : 'Like')))}
              >
                  <span style={{ fontSize: '1.2rem', lineHeight: 1, color: isOwner ? '#6c757d' : (isLiked ? '#e53935' : '#ccc') }}>
                      {isLiking ? '...' : (isOwner ? '🖤' : (isLiked ? '❤️' : '🤍'))}
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#495057' }}>{displayLikeCount}</span>
              </div>
            </div>

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
                    {!isLoadingContext && !isFetchingTransaction && (
                        <UserRatingDisplay userId={currentUserId} initialData={sellerRatingInitialData} />
                    )}
                  </div>
                </div>

                {(isLoadingContext || isFetchingTransaction) ? (
                    <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                      <LoadingDots />
                    </div>
                ) : (
                    <>
                        {/* Show chat count button if chats exist */}
                        {chatCount > 0 ? (
                            <button className="btn-chat" style={{ backgroundColor: "#0077B6", marginBottom: '0.5rem' }} onClick={handleViewChats}>
                                View {chatCount} Chat{chatCount !== 1 ? 's' : ''}
                            </button>
                        ) : null}

                        {/* Owner Status Actions */}
                        {isSold ? (
                        <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                            <div className="action-note" style={{ color: '#e53935', fontWeight: 'bold' }}>
                                Item marked as Sold
                            </div>
                            
                            {activeTransaction ? (() => {
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
                            })() : null}
                        </div>
                        ) : isRented ? (
                        /* --- Rented Controls --- */
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 'bold', color: '#0284c7' }}>Item is Rented</span>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    {activeTransaction ? `${formatRentalDate(activeTransaction.startDate)} - ${formatRentalDate(activeTransaction.endDate)}` : ''}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn-chat" 
                                    style={{ backgroundColor: "#ffffff", color: "#0284c7", border: "1px solid #0284c7", flex: 1, fontSize: '0.85rem', opacity: !activeTransaction ? 0.6 : 1 }} 
                                    onClick={() => setShowEditDatesModal(true)}
                                    disabled={!activeTransaction}
                                >
                                    Edit Dates
                                </button>
                                <button 
                                    className="btn-chat" 
                                    style={{ backgroundColor: "#e53935", flex: 1, fontSize: '0.85rem', opacity: !activeTransaction ? 0.6 : 1 }} 
                                    onClick={handleReturnItem}
                                    disabled={!activeTransaction}
                                >
                                    Mark Returned
                                </button>
                            </div>

                            {/* Review Renter Logic */}
                            {activeTransaction ? (() => {
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
                                            textAlign: 'center'
                                        }}>
                                            ✓ You reviewed this renter
                                        </div>
                                    );
                                }

                                return (
                                    <button 
                                        className="btn-chat" 
                                        style={{ 
                                            marginTop: '0.75rem', 
                                            backgroundColor: "#f1c40f", 
                                            color: "#333",
                                            fontSize: '0.9rem'
                                        }}
                                        onClick={() => setShowReviewModal(true)}
                                    >
                                        ⭐ Review Renter
                                    </button>
                                );
                            })() : null}
                        </div>
                        ) : (
                        /* --- Available Controls --- */
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button className="btn-chat" style={{ backgroundColor: "var(--text-muted)", flex: 1 }} onClick={() => { 
                                const idToUse = currentListing.publicId || currentListing.listingId;
                                navigate(`/edit-listing/${idToUse}`, { 
                                state: { 
                                    returnTo: window.location.pathname, 
                                    openListingId: currentListing.listingId 
                                } 
                                }); 
                                onClose(); 
                            }}>
                                Edit
                            </button>
                            <button className="btn-chat" style={{ backgroundColor: "#2ecc71", flex: 1 }} onClick={() => setShowMarkSoldModal(true)}>
                                {isRentType ? 'Mark as Rented' : 'Mark as Sold'}
                            </button>
                        </div>
                        )}
                    </>
                )}
              </>
            ) : (
              /* VIEW 2: BUYER / VISITOR */
              <>
                <div className="seller-info-header">
                  <img src={seller.avatarUrl ? (seller.avatarUrl.startsWith('http') ? seller.avatarUrl : `http://localhost:8080${seller.avatarUrl}`) : defaultAvatar} alt="Seller Avatar" className="seller-avatar" onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }} />
                  <div className="seller-details">
                    <div className="seller-username">
                        {(() => {
                          const isLoggedIn = !!localStorage.getItem('eduRentUserData');
                          const basePath = isLoggedIn ? '' : '/guest';
                          return (
                            <Link to={`${basePath}/profile/${seller.profileSlug}`} onClick={onClose} className="seller-link">{seller.username}</Link>
                          );
                        })()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '2px' }}>{seller.school}</div>
                      {!isLoadingContext && !isFetchingTransaction && (
                        <UserRatingDisplay userId={seller.id} initialData={sellerRatingInitialData} />
                      )}
                  </div>
                </div>

                {/* Show loading state for chat count or button to prevent jump */}
                {(isLoadingContext || isFetchingTransaction) ? (
                    <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                      <LoadingDots />
                    </div>
                ) : (
                    <>
                    {/* Item Status Handling */}
                    {isSold ? (
                        <>
                            {isBuyer ? (
                                /* Buyer view for sold item */
                                <>
                                    <div style={{ 
                                        fontSize: '0.95rem', 
                                        fontWeight: '600', 
                                        color: '#e53935', 
                                        textAlign: 'center' 
                                    }}>
                                        ✓ Sold to You
                                    </div>
                                    {/* Review Seller Logic */}
                                    {activeTransaction ? (() => {
                                        const userHasReviewed = activeTransaction.reviews?.some(
                                            r => r.reviewer?.userId === currentUserId || r.reviewer?.id === currentUserId
                                        );

                                        if (userHasReviewed) {
                                            return (
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                                                    <span>✓</span> You reviewed this seller
                                                </div>
                                            );
                                        }

                                        return (
                                            <button 
                                                className="btn-chat" 
                                                style={{ backgroundColor: "#ffc107", color: "#000", marginTop: '0.5rem' }} 
                                                onClick={() => {
                                                    setShowReviewModal(true);
                                                }}
                                            >
                                                ⭐ Review Seller
                                            </button>
                                        );
                                    })() : null}
                                </>
                            ) : (
                                /* Public/other user view for sold item */
                                <div className="action-note" style={{ color: '#dc3545', fontWeight: 'bold' }}>SOLD</div>
                            )}
                        </>
                    ) : isRented ? (
                        <>
                             {/* Renter View Controls - Restricted to actual renter only */}
                             <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isBuyer ? '0.5rem' : '0' }}>
                                    <span style={{ fontWeight: 'bold', color: '#0284c7' }}>Item is Rented</span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        {activeTransaction ? `${formatRentalDate(activeTransaction.startDate)} - ${formatRentalDate(activeTransaction.endDate)}` : ''}
                                    </span>
                                </div>
                                {/* Only the actual renter can review - but NOT edit dates or return */}
                                {isBuyer ? (
                                  <>
                                    <div style={{ 
                                        marginTop: '0.5rem', 
                                        fontSize: '0.95rem', 
                                        fontWeight: '600', 
                                        color: '#2ecc71', 
                                        textAlign: 'center' 
                                    }}>
                                        ✓ Rented to You
                                    </div>
                                    <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                                        {(() => {
                                            const userHasReviewed = activeTransaction?.reviews?.some(
                                                r => r.reviewer?.userId === currentUserId || r.reviewer?.id === currentUserId
                                            );

                                            if (userHasReviewed) {
                                                return (
                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                                                        <span>✓</span> You reviewed this seller
                                                    </div>
                                                );
                                            }

                                            return (
                                                <button 
                                                    className="btn-chat" 
                                                    style={{ backgroundColor: "#ffc107", color: "#000", marginTop: '0.5rem', width: '100%' }} 
                                                    onClick={() => {
                                                        setShowReviewModal(true);
                                                    }}
                                                >
                                                    ⭐ Review Seller
                                                </button>
                                            );
                                        })()}
                                    </div>
                                  </>
                                ) : (
                                  /* Public viewer of rented item - show option to reserve */
                                  <>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>
                                        Interested in this item?
                                    </div>
                                    <button className="btn-chat" style={{ marginTop: '0.5rem' }} onClick={handleChatClick}>
                                        {existingChat ? 'View Existing Chat' : 'Chat with Seller to Reserve'}
                                    </button>
                                  </>
                                )}
                             </div>
                        </>
                    ) : (
                        <div className="action-note">Interested in this item?</div>
                    )}

                    {/* Chat Button - Only if available (not sold/rented) */}
                    {!isSold && !isRented && (
                        <button className="btn-chat" onClick={handleChatClick}>
                        {existingChat ? 'View Existing Chat' : 'Chat with the Seller'}
                        </button>
                    )}

                    {/* Social Links Section - Show for available and rented items, hide for sold */}
                    {!isSold && (seller.facebookUrl || seller.instagramUrl) && (
                    <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Or contact via social
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                        {seller.facebookUrl && (
                            <SocialIcon 
                            platform="facebook" 
                            href={seller.facebookUrl} 
                            title="Contact on Facebook" 
                            />
                        )}
                        {seller.instagramUrl && (
                            <SocialIcon 
                            platform="instagram" 
                            href={seller.instagramUrl} 
                            title="Contact on Instagram" 
                            />
                        )}
                        </div>
                    </div>
                    )}
                    </>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* --- Modals --- */}
      {showMarkSoldModal && (
        <MarkAsSoldModal 
          listing={currentListing}
          currentUser={{ userId: currentUserId }}
          onClose={() => setShowMarkSoldModal(false)}
          onSuccess={() => {
            setShowMarkSoldModal(false);
            // Local update: Set status to Sold/Rented
            // Note: isRentType calc might need care if we just update status.
            const newStatus = isRentType ? 'Rented' : 'Sold';
            setCurrentListing(prev => ({ ...prev, status: newStatus }));
            
            // Allow state effect to fetch transaction
            // But fetchActiveTransaction depends on status change which just happened 
            // So we can also call it manually to be safe or rely on useEffect
            // Triggering explicit fetch is safer for immediate feedback
            setTimeout(() => fetchActiveTransaction(), 300); // Small delay to ensure DB update
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
                    // Reload transaction to get new review
                    fetchActiveTransaction();
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
                  fetchActiveTransaction();
              }}
          />
      )}


      
      <LoadingOverlay isVisible={isProcessing} message="Returns in progress..." />

    </div>
  );
}
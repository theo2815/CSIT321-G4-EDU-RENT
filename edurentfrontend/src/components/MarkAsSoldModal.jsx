import React, { useState, useEffect } from 'react';
import { getConversationsForUser, createTransaction } from '../services/apiService';
import defaultAvatar from '../assets/default-avatar.png';
import LoadingOverlay from './LoadingOverlay';
import '../static/ProductDetailModal.css';

// Import Feedback Hook
import { useToast } from '../context/ToastContext';

export default function MarkAsSoldModal({ listing, currentUser, onClose, onSuccess }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Feedback hook
  const { showSuccess, showError } = useToast();
  
  // Helper for validation
  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };
  const today = getTodayDate();
  
  // New state for rental dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Determine mode based on listing type
  const isRent = listing.listingType?.toUpperCase().includes('RENT');
  const actionLabel = isRent ? 'Mark as Rented' : 'Mark as Sold';
  const pastTenseLabel = isRent ? 'Rented' : 'Sold';

  useEffect(() => {
    const fetchRelevantChats = async () => {
      try {
        // Fetch all user conversations
        const response = await getConversationsForUser(currentUser.userId);
        const allChats = response.data || [];

        // Filter: Keep only chats related to THIS specific listing
        const relevantChats = allChats.filter(chat => 
          chat.listing && chat.listing.listingId === listing.listingId
        );

        setConversations(relevantChats);
      } catch (error) {
        console.error("Failed to load potential buyers", error);
        showError("Could not load buyer list.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchRelevantChats();
    }
  }, [currentUser, listing, showError]);

  const handleConfirm = async () => {
    if (!selectedBuyerId) {
        showError("Please select a buyer first.");
        return;
    }
    
    // Validation: Require dates if this is a rental
    if (isRent) {
        if (!startDate || !endDate) {
            showError("Please select both start and end dates for the rental.");
            return;
        }
        if (startDate < today) {
            showError("Start date cannot be in the past.");
            return;
        }
        if (endDate < startDate) {
            showError("End date cannot be before the start date.");
            return;
        }
    }

    setSubmitting(true);

    try {
      await createTransaction({
        listingId: listing.listingId,
        buyerId: selectedBuyerId,
        transactionType: isRent ? 'Rent' : 'Sale',
        status: isRent ? 'Active' : 'Completed', // Active for ongoing rent, Completed for immediate sale
        startDate: isRent ? startDate : null,
        endDate: isRent ? endDate : null
      });
      
      showSuccess(`Item marked as ${pastTenseLabel} successfully!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(`Failed to mark as ${pastTenseLabel}:`, error);
      showError("Failed to create transaction. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Extract the "Other User" (The potential buyer) from the participants list
  const getBuyer = (participants) => {
    return participants.find(p => p.userId !== currentUser.userId) || {};
  };

  return (
    <div className="modal-overlay visible" style={{ zIndex: 1100 }}>
      <div className="mark-sold-modal-content">
        <div className="modal-header">
          <h3 className="modal-title">{actionLabel}</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="mark-sold-body">
          <p className="mark-sold-question">Who did you {isRent ? 'rent' : 'sell'} it to?</p>

          {loading ? (
            <div className="skeleton-loader">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <p className="no-chats-msg">No conversations found for this item.</p>
          ) : (
            <div className="buyer-list">
              {conversations.map((conv) => {
                const buyer = getBuyer(conv.participants);
                return (
                  <label 
                    key={conv.conversationId} 
                    className={`buyer-item ${selectedBuyerId === buyer.userId ? 'selected' : ''}`}
                  >
                    <input 
                      type="radio" 
                      name="buyer" 
                      value={buyer.userId}
                      onChange={() => setSelectedBuyerId(buyer.userId)}
                      checked={selectedBuyerId === buyer.userId}
                    />
                    <img 
                      src={buyer.profilePictureUrl ? `http://localhost:8080${buyer.profilePictureUrl}` : defaultAvatar} 
                      alt={buyer.fullName} 
                      className="buyer-avatar"
                      onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                    />
                    <div className="buyer-info">
                      <span className="buyer-name">{buyer.fullName}</span>
                      <span className="buyer-last-msg">{conv.lastMessageContent || 'No messages yet'}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          
          {/* Date Inputs - Only visible for Rentals after a buyer is selected */}
          {isRent && selectedBuyerId && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.8rem' }}>Rental Period</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem', color: '#6c757d' }}>Start Date</label>
                        <input 
                            type="date" 
                            className="form-input" 
                            style={{ padding: '0.4rem', width: '100%' }}
                            value={startDate}
                            min={today}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                // Auto-adjust end date if it becomes invalid
                                if (endDate && e.target.value > endDate) {
                                    setEndDate(e.target.value);
                                }
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem', color: '#6c757d' }}>End Date</label>
                        <input 
                            type="date" 
                            className="form-input" 
                            style={{ padding: '0.4rem', width: '100%' }}
                            value={endDate}
                            min={startDate || today}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>
          )}

        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-primary-accent" 
            onClick={handleConfirm}
            disabled={!selectedBuyerId || submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Confirming...' : `Confirm ${isRent ? 'Rented' : 'Sold'}`}
          </button>
        </div>
      </div>
      <LoadingOverlay isVisible={submitting} message={`Marking as ${pastTenseLabel}...`} />
    </div>
  );
}
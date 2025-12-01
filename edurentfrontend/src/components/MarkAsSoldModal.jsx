// This component is a modal to mark a listing as sold by selecting a buyer from existing conversations

import React, { useState, useEffect } from 'react';
import { getConversationsForUser, createTransaction } from '../services/apiService';
import defaultAvatar from '../assets/default-avatar.png';
import '../static/ProductDetailModal.css';

export default function MarkAsSoldModal({ listing, currentUser, onClose, onSuccess }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchRelevantChats();
    }
  }, [currentUser, listing]);

  const handleConfirm = async () => {
    if (!selectedBuyerId) return;
    setSubmitting(true);

    try {
      await createTransaction({
        listingId: listing.listingId,
        buyerId: selectedBuyerId,
        transactionType: 'Sale', // Or 'Rent' depending on context
        status: 'Completed'
      });
      
      alert("Item marked as sold successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to mark as sold:", error);
      alert("Failed to create transaction. Please try again.");
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
          <h3 className="modal-title">Mark as Sold</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="mark-sold-body">
          <p className="mark-sold-question">Who did you sell it to?</p>

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
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-primary-accent" 
            onClick={handleConfirm}
            disabled={!selectedBuyerId || submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Confirming...' : 'Confirm Sold'}
          </button>
        </div>
      </div>
    </div>
  );
}
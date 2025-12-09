// This hooks manages page logic for listing modals, including like functionality and pre-fetching context data
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useLikes from './useLikes';
import { getListingById, getUserReviews, getConversationsForUser } from '../services/apiService';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';

export default function usePageLogic(userData, likeData = null) {
  const navigate = useNavigate();

  // --- State Management ---
  // Stores pre-fetched data about the conversation status (e.g., "Sold to You", "View Chat")
  const [modalContext, setModalContext] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [sellerRatingData, setSellerRatingData] = useState(null);

  // --- 1. Like Logic Initialization ---
  // If the parent component manages likes (e.g., ProfilePage), use that data.
  // Otherwise, initialize the useLikes hook internally.
  const internalLikes = useLikes();
  const {
    likedListingIds,
    likingInProgress,
    isLoadingLikes,
    likeError,
    handleLikeToggle,
    refetchLikes
  } = likeData || internalLikes;

  // --- 2. Modal Handlers ---
  // Closes the modal and clears state
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedListing(null);
    setSellerRatingData(null);
    setModalContext(null);
  }, []);

  // Fetches listing details and pre-calculates context before opening the modal
  const handleOpenListing = useCallback(async (listingId) => {
    if (!listingId) return;

    closeModal();
    setIsModalLoading(true);

    try {
      // Prepare parallel requests for efficiency
      const promises = [getListingById(listingId)];

      if (userData?.userId) {
        promises.push(getConversationsForUser(userData.userId));
      }

      const [listingRes, conversationsRes] = await Promise.all(promises);

      if (listingRes.data) {
        const listing = listingRes.data;
        setSelectedListing(listing);

        // --- Calculate Conversation Context ---
        let context = {
          relatedConversations: [],
          existingChat: null,
          chatCount: 0
        };

        if (conversationsRes?.data) {
          const related = conversationsRes.data.filter(c => 
            c.listing && c.listing.listingId === listing.listingId
          );

          context.relatedConversations = related;
          context.chatCount = related.length;
          context.existingChat = related.length > 0 ? related[0] : null; 
        }

        setModalContext(context);

       // Fetch seller rating data for display in the modal 
        const sellerId = listing.user?.userId;
        if (sellerId) {
            try {
                const reviewRes = await getUserReviews(sellerId);
                const reviews = reviewRes.data || [];
                const count = reviews.length;
                const avg = count > 0 
                  ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1)
                  : 0;
                setSellerRatingData({ avg, count });
            } catch (e) {
                console.warn("Could not fetch seller reviews:", e);
                setSellerRatingData(null);
            }
        }

        setIsModalOpen(true);
      } else {
        throw new Error(`Listing ${listingId} not found.`);
      }
    } catch (err) {
      console.error("Failed to fetch listing data:", err);
      alert(`Could not load item: ${err.message || 'Unknown error'}`);
    } finally {
      setIsModalLoading(false); 
    }
  }, [closeModal, userData]);

  // Opens the modal for a given listing object
  const openModal = useCallback((listing) => {
    if (listing && listing.listingId) {
        handleOpenListing(listing.listingId);
    } else {
        console.error("Attempted to open listing without an ID:", listing);
    }
  }, [handleOpenListing]);

  // Handles notification clicks by extracting listing ID and opening the modal
  const handleNotificationClick = useCallback(async (notification) => {
    // Handle Message Notifications
    if (notification.type === 'NEW_MESSAGE') {
        const urlParts = notification.linkUrl?.split('/');
        const conversationId = urlParts ? parseInt(urlParts[urlParts.length - 1], 10) : null;
        
        if (conversationId) {
            navigate('/messages', { state: { openConversationId: conversationId } });
        } else {
            navigate('/messages');
        }
        return;
    }

    // Handle Profile/Review Notifications (Redirect logic)
    if (notification.linkUrl && notification.linkUrl.startsWith('/profile')) {
        navigate(notification.linkUrl);
        return;
    }

    // Handle Listing/Like Notifications (Modal logic)
    const urlParts = notification.linkUrl?.split('/');
    const listingId = urlParts ? parseInt(urlParts[urlParts.length - 1], 10) : null;

    if (!listingId) {
      console.error("Invalid notification link:", notification.linkUrl);
      return;
    }
    handleOpenListing(listingId); 
  }, [handleOpenListing, navigate]);

  // --- 3. Render Helper ---
  
  // Memoized modal component to avoid unnecessary re-renders
  const ModalComponent = useCallback(() => (
    <>
      {isModalOpen && selectedListing && (
         <ProductDetailModal 
           listing={selectedListing} 
           onClose={closeModal} 
           currentUserId={userData?.userId}
           isLiked={likedListingIds.has(selectedListing.listingId)}
           onLikeClick={handleLikeToggle}
           isLiking={likingInProgress.has(selectedListing.listingId)}
           sellerRatingInitialData={sellerRatingData}
           initialContext={modalContext} // Pass the pre-calculated context
         />
      )}
      {isModalLoading && (
        <ProductDetailModalSkeleton onClose={() => setIsModalLoading(false)} />
      )}
    </>
  ), [
      isModalOpen, 
      selectedListing, 
      closeModal, 
      userData?.userId, 
      likedListingIds, 
      handleLikeToggle, 
      likingInProgress,
      isModalLoading,
      sellerRatingData,
      modalContext
  ]);

  return {
    // Expose like logic properties only if using internal hook (prevents prop collision)
    ...(likeData ? {} : {
        likedListingIds,
        likingInProgress,
        isLoadingLikes,
        likeError,
        handleLikeToggle,
        refetchLikes
    }),

    openModal,
    closeModal,
    handleOpenListing,
    handleNotificationClick,
    ModalComponent
  };
}
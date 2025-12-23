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
  const [isContextLoading, setIsContextLoading] = useState(false); // New state to track background fetch

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
    setIsContextLoading(false);
  }, []);

  // Fetches listing details and pre-calculates context before opening the modal
  const handleOpenListing = useCallback(async (listingId, options = {}, partialListing = null) => {
    if (!listingId) return;

    closeModal();
    setIsContextLoading(true); // Start background loading

    // Optimistic Open: If we have partial data (from the card), show it immediately
    if (partialListing) {
        setSelectedListing(partialListing);
        setIsModalOpen(true);
    } else {
        // Only show loading spinner if we have NO data to show yet
        setIsModalLoading(true);
    }

    try {
      // Prepare parallel requests for efficiency
      const promises = [getListingById(listingId)];

      if (userData?.userId) {
        promises.push(getConversationsForUser(userData.userId));
      }

      const [listingRes, conversationsRes] = await Promise.all(promises);

      if (listingRes.data) {
        const listing = listingRes.data;
        setSelectedListing(listing); // Update with full details (fresh data)

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
        
        // Pass the requested action (e.g. review) into the context
        if (options.initialReviewAction) {
            context.initialAction = 'review';
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

        if (!partialListing) setIsModalOpen(true);
      } else {
        throw new Error(`Listing ${listingId} not found.`);
      }
    } catch (err) {
      console.error("Failed to fetch listing data:", err);
      // If we opened optimistically but failed to fetch, we might want to alert or close
      // For now, simple alert or keep the stale data visible if it was partial
      if (!partialListing) alert(`Could not load item: ${err.message || 'Unknown error'}`);
    } finally {
      setIsModalLoading(false); 
      setIsContextLoading(false); // End background loading
    }
  }, [closeModal, userData]);

  // Opens the modal for a given listing object
  const openModal = useCallback((listing) => {
    if (listing && listing.listingId) {
        // Pass the listing as partial data for optimistic loading
        handleOpenListing(listing.listingId, {}, listing);
    } else {
        console.error("Attempted to open listing without an ID:", listing);
    }
  }, [handleOpenListing]);

  // Handles notification clicks by extracting listing ID and opening the modal
  const handleNotificationClick = useCallback(async (notification) => {
    if (!notification.linkUrl) return;

    // 1. Handle Message Notifications
    // We check the URL string directly instead of relying solely on notification.type
    if (notification.linkUrl.includes('/messages')) {
        const urlParts = notification.linkUrl.split('/').filter(part => part !== '');
        const conversationId = parseInt(urlParts[urlParts.length - 1], 10);
        
        if (conversationId && !isNaN(conversationId)) {
            navigate('/messages', { state: { openConversationId: conversationId } });
        } else {
            navigate('/messages');
        }
        return;
    }

    // 2. Handle Profile/Review Notifications
    if (notification.linkUrl.includes('/profile')) {
        navigate(notification.linkUrl);
        return;
    }

    // 3. Handle Listing Notifications (Modal Logic)
    try {
        const urlObj = new URL(notification.linkUrl, window.location.origin);
        const urlParts = urlObj.pathname.split('/').filter(p => p !== '');
        const listingId = parseInt(urlParts[urlParts.length - 1], 10);
        const shouldReview = urlObj.searchParams.get('review') === 'true';

        if (!listingId || isNaN(listingId)) {
            // Fallback: If we can't parse an ID, just go to the link
            navigate(notification.linkUrl);
            return;
        }

        handleOpenListing(listingId, { initialReviewAction: shouldReview });
    } catch (e) {
        console.error("Error parsing notification URL:", e);
        navigate(notification.linkUrl);
    }
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
           initialAction={modalContext?.initialAction} // Pass intent
           isLoadingContext={isContextLoading} // Pass loading state
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
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useLikes from './useLikes';
import { getListingById, getUserReviews, getConversationsForUser } from '../services/apiService';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';

/**
 * Custom hook to manage page-level logic for listings, modals, and interactions.
 * * Capabilities:
 * 1. Manages "Like" functionality (toggle, status).
 * 2. Manages Product Detail Modal state (open/close, loading).
 * 3. Pre-fetches necessary context (Listing details, Seller Reviews, Conversation history)
 * to prevent data "pop-in" or loading spinners inside the modal itself.
 *
 * @param {object} userData - The logged-in user's data object.
 * @param {object} likeData - Optional. If provided, overrides internal like logic (useful for ProfilePage).
 */
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

  /**
   * Resets all modal-related state to ensure a clean slate when reopening.
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedListing(null);
    setSellerRatingData(null);
    setModalContext(null);
  }, []);

  /**
   * Primary handler to open a listing.
   * Performs parallel data fetching to gather all context (Item, Seller Rating, Chat History)
   * before displaying the modal to the user.
   */
  const handleOpenListing = useCallback(async (listingId) => {
    if (!listingId) return;

    closeModal();
    setIsModalLoading(true);

    try {
      // Prepare parallel requests for efficiency
      const promises = [getListingById(listingId)];

      // If the user is logged in, fetch their conversation history.
      // This context allows the modal to immediately know if:
      // a) The user is the seller (viewing their own item).
      // b) The user is a buyer who has already chatted about this item.
      // c) The user is the specific buyer who bought this sold item.
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
          // Filter user's conversations to find those linked to this specific listing
          const related = conversationsRes.data.filter(c => 
            c.listing && c.listing.listingId === listing.listingId
          );

          context.relatedConversations = related;
          context.chatCount = related.length; // Useful for sellers (total inquiries)
          // If a chat exists, grab the most recent one (usually index 0)
          context.existingChat = related.length > 0 ? related[0] : null; 
        }

        setModalContext(context);
        // -------------------------------------

        // --- Fetch Seller Reviews ---
        // We fetch this silently (async) but wait for it here to prevent layout shift.
        // A failure here is non-critical and won't stop the modal from opening.
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

  /**
   * Wrapper for click events on listing cards.
   * Ensures the listing object is valid before attempting to fetch details.
   */
  const openModal = useCallback((listing) => {
    if (listing && listing.listingId) {
        handleOpenListing(listing.listingId);
    } else {
        console.error("Attempted to open listing without an ID:", listing);
    }
  }, [handleOpenListing]);

  /**
   * Handler for incoming notifications.
   * Parses the notification URL to extract the listing ID and open the modal.
   */
  const handleNotificationClick = useCallback(async (notification) => {
    const urlParts = notification.linkUrl?.split('/');
    const listingId = urlParts ? parseInt(urlParts[urlParts.length - 1], 10) : null;

    if (!listingId) {
      console.error("Invalid notification link:", notification.linkUrl);
      return;
    }
    handleOpenListing(listingId); 
  }, [handleOpenListing]);

  // --- 3. Render Helper ---
  
  /**
   * Returns the Modal component ready to be rendered by the parent.
   * Passes all accumulated state, including the new 'initialContext'.
   */
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

  // --- Return Values ---
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
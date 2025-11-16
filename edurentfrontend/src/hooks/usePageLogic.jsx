import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useLikes from './useLikes'; // Import our existing useLikes hook
import { getListingById } from '../services/apiService';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';

/**
 * Manages all shared logic for pages that display listings.
 * - Handles all "Like" logic via the useLikes hook.
 * - Handles all "Product Modal" logic (opening, closing, loading, rendering).
 * - Handles the "Notification Click" logic.
 *
 * @param {object} userData - The logged-in user's data object from useAuth.
 * @returns {object} An object containing all necessary state and handlers.
 */
export default function usePageLogic(userData, likeData = null) {
  const navigate = useNavigate();

  // --- 1. Like Logic ---
  // Use the passed-in likeData if provided, otherwise fetch it internally
  const internalLikes = useLikes();
  const { 
    likedListingIds, 
    likingInProgress, 
    isLoadingLikes, 
    likeError, 
    handleLikeToggle,
    refetchLikes
  } = likeData || internalLikes; // <-- Use passed-in data or internal hook

  // --- 2. Modal Logic (RE-ORDERED) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedListing(null);
  }, []); // This function has no dependencies, so it's safe first.

  // --- handleOpenListing is NOW DEFINED FIRST ---
  const handleOpenListing = useCallback(async (listingId) => {
    if (!listingId) {
      console.error("No listing ID provided");
      return;
    }
    
    closeModal(); // Close any existing modal
    setIsModalLoading(true); // Show loading skeleton

    try {
      const response = await getListingById(listingId); 
      if (response.data) {
        setSelectedListing(response.data);
        setIsModalOpen(true);
      } else {
        throw new Error(`Listing ${listingId} not found.`);
      }
    } catch (err) {
      console.error("Failed to fetch listing for modal:", err);
      alert(`Could not load item: ${err.message}.`);
    } finally {
      setIsModalLoading(false); // Hide loading skeleton
    }
  }, [closeModal]); // Depends on closeModal, which is defined above

  // --- openModal is NOW DEFINED SECOND ---
  // It can safely access handleOpenListing
  const openModal = useCallback((listing) => {
    if (listing && listing.listingId) {
        handleOpenListing(listing.listingId);
    } else {
        console.error("Clicked listing has no ID:", listing);
    }
  }, [handleOpenListing]); // Depends on handleOpenListing, which is defined above

  // --- 3. Notification Click Handler ---
  // (This is also safe now)
  const handleNotificationClick = useCallback(async (notification) => {
    console.log("Notification clicked:", notification);
    const urlParts = notification.linkUrl?.split('/');
    const listingId = urlParts ? parseInt(urlParts[urlParts.length - 1], 10) : null;

    if (!listingId) {
      console.error("Could not parse listingId from notification linkUrl:", notification.linkUrl);
      alert("Could not open this notification: Invalid link.");
      return;
    }
    handleOpenListing(listingId); 
  }, [handleOpenListing]);

  // --- 4. Modal Renderer (No change) ---
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
      isModalLoading
  ]);

  const likeLogic = {
    likedListingIds,
    likingInProgress,
    isLoadingLikes,
    likeError,
    handleLikeToggle,
    refetchLikes
  };
  
  return {
    // Conditionally return likeLogic ONLY if we fetched it internally
    ...(likeData ? {} : likeLogic), 

    // Modal State & Functions
    openModal,
    closeModal,
    handleOpenListing,

    // Notification Handler
    handleNotificationClick,

    // Modal Component
    ModalComponent
  };
}
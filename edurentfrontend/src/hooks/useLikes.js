// This hooks manages liked listings, including fetching, liking, unliking, and state management
import { useState, useEffect, useCallback, useRef } from 'react';
import { getLikedListings, likeListing, unlikeListing } from '../services/apiService';

// Manages global like state and handles API interactions
export default function useLikes() {
  
  // --- State ---

  // Set of IDs for efficient O(1) lookup
  const [likedListingIds, setLikedListingIds] = useState(new Set());
  
  // Tracks items currently being processed to prevent race conditions
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  
  // Full listing details for the display list
  const [likedListings, setLikedListings] = useState([]);
  
  const [isLoadingLikes, setIsLoadingLikes] = useState(true);
  const [likeError, setLikeError] = useState(null);

  // --- Refs ---

  // Refs allow access to current state inside async callbacks
  const likedIdsRef = useRef(likedListingIds);
  const likingInProgressRef = useRef(likingInProgress);

  // Keep refs synced with state
  useEffect(() => {
    likedIdsRef.current = likedListingIds;
  }, [likedListingIds]);

  useEffect(() => {
    likingInProgressRef.current = likingInProgress;
  }, [likingInProgress]);

  // --- Data Fetching ---

  // Fetches liked items from the API
  const fetchLikes = useCallback(async () => {
    setIsLoadingLikes(true);
    setLikeError(null);
    try {
      const response = await getLikedListings();
      const listings = response.data || [];
      
      // Create a Set of IDs for fast lookup
      const likedIds = new Set(listings.map(listing => listing.listingId));
      
      setLikedListings(listings);
      setLikedListingIds(likedIds);
    } catch (err) {
      console.error("Failed to fetch liked listings:", err);
      setLikeError("Could not load liked items. Please refresh.");
    } finally {
      setIsLoadingLikes(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);


  // --- Handlers ---

  // Toggles like status with race condition protection
  const handleLikeToggle = useCallback(async (listingId) => {
    
    // Prevent double-clicks/overlapping requests
    if (likingInProgressRef.current.has(listingId)) {
      console.log("Like action already in progress for item:", listingId);
      return;
    }

    // Add to in-progress set
    const newLikingSet = new Set(likingInProgressRef.current).add(listingId);
    likingInProgressRef.current = newLikingSet;
    setLikingInProgress(newLikingSet);
    setLikeError(null);

    // Check current status via ref
    const isCurrentlyLiked = likedIdsRef.current.has(listingId);

    // Optimistic UI update: Toggle state immediately
    setLikedListingIds(prevIds => {
      const newIds = new Set(prevIds);
      if (isCurrentlyLiked) {
        newIds.delete(listingId);
      } else {
        newIds.add(listingId);
      }
      likedIdsRef.current = newIds;
      return newIds;
    });
    
    // API Call
    try {
      if (isCurrentlyLiked) {
        await unlikeListing(listingId);
        console.log(`Unliked item ${listingId}`);

        // Remove from list only after server confirmation
        setLikedListings(prev => prev.filter(item => item.listingId !== listingId));

      } else {
        await likeListing(listingId);
        console.log(`Liked item ${listingId}`);
      }
    } catch (err) {
      // Revert state if API call fails
      console.error("Failed to toggle like:", err);
      setLikeError("Failed to update like. Please refresh.");
      fetchLikes(); 
    } finally {
      // Cleanup: Remove from in-progress set
      setLikingInProgress(prevSet => {
        const nextSet = new Set(prevSet);
        nextSet.delete(listingId);
        likingInProgressRef.current = nextSet;
        return nextSet;
      });
    }
  }, [fetchLikes]);

  return {
    likedListingIds,
    likedListings,
    likingInProgress,
    isLoadingLikes,
    likeError,
    handleLikeToggle,
    refetchLikes: fetchLikes
  };
}
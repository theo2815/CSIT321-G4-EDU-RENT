// hooks/useLikes.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { getLikedListings, likeListing, unlikeListing } from '../services/apiService';

/**
 * A hook to manage the global "like" state of listings.
 * It handles fetching liked items, toggling likes, and manages all
 * loading, error, and race-condition states.
 */
export default function useLikes() {
  // --- State ---

  // A Set for fast O(1) lookups of *which* items are liked.
  const [likedListingIds, setLikedListingIds] = useState(new Set());
  
  // A Set to track items currently being processed by an API call.
  // This is used to prevent double-clicks and race conditions.
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  
  // The full array of liked listing objects, used to render the Likes page.
  const [likedListings, setLikedListings] = useState([]);
  
  // Loading state for the initial fetch of liked items.
  const [isLoadingLikes, setIsLoadingLikes] = useState(true);
  
  // Error state for any like-related API failures.
  const [likeError, setLikeError] = useState(null);

  // --- Refs ---

  // A ref mirroring `likedListingIds`.
  // This provides a stable, synchronous way to get the *latest*
  // like status inside callbacks without re-triggering them.
  const likedIdsRef = useRef(likedListingIds);
  
  // A ref mirroring `likingInProgress`.
  // Used for instant, synchronous checks to prevent race conditions.
  const likingInProgressRef = useRef(likingInProgress);

  // --- Ref Synchronization ---

  // Keeps `likedIdsRef` in sync with its state.
  useEffect(() => {
    likedIdsRef.current = likedListingIds;
  }, [likedListingIds]);

  // Keeps `likingInProgressRef` in sync with its state.
  useEffect(() => {
    likingInProgressRef.current = likingInProgress;
  }, [likingInProgress]);

  // --- Data Fetching ---

  /**
   * Fetches all liked listings from the API.
   * Populates both the full list (`likedListings`) and the
   * fast-lookup Set (`likedListingIds`).
   */
  const fetchLikes = useCallback(async () => {
    setIsLoadingLikes(true);
    setLikeError(null);
    try {
      const response = await getLikedListings();
      const listings = response.data || [];
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

  // Fetches the user's likes when the hook is first mounted.
  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);


  // --- Like/Unlike Logic ---

  /**
   * Handles toggling a "like" on or off for a specific listing.
   * This function is designed to be "bulletproof" against race conditions.
   */
  const handleLikeToggle = useCallback(async (listingId) => {
    
    // 1. Race Condition Guard (Double-Click Prevention)
    // Synchronously check the ref. If a request for this item is
    // already in progress, stop execution.
    if (likingInProgressRef.current.has(listingId)) {
      console.log("Like action already in progress for item:", listingId);
      return;
    }

    // 2. Set "In-Progress" State
    // Synchronously update the ref *first* to win any potential race
    // condition, then update state to trigger a re-render.
    const newLikingSet = new Set(likingInProgressRef.current).add(listingId);
    likingInProgressRef.current = newLikingSet;
    setLikingInProgress(newLikingSet);
    setLikeError(null);

    // 3. Get Current Status
    // Read from the ref to get the *actual* current like status,
    // safe from React's state batching.
    const isCurrentlyLiked = likedIdsRef.current.has(listingId);

    // 4. Optimistic UI Update (for Like Status)
    // Immediately update the `Set` of IDs. This will instantly
    // change the state of like buttons (e.g., 🤍 -> ❤️) across the
    // app without waiting for the API.
    setLikedListingIds(prevIds => {
      const newIds = new Set(prevIds);
      if (isCurrentlyLiked) {
        newIds.delete(listingId);
      } else {
        newIds.add(listingId);
      }
      // Keep the ref synced atomically with the state update.
      likedIdsRef.current = newIds;
      return newIds;
    });
    
    // 5. API Call
    try {
      if (isCurrentlyLiked) {
        // --- UNLIKE PATH ---
        await unlikeListing(listingId);
        console.log(`Unliked item ${listingId}`);

        // 6. Pessimistic UI Update (for List Removal)
        // Only remove the item from the *visible list* *after* the
        // API call successfully completes. This breaks the "item comeback"
        // feedback loop bug.
        setLikedListings(prev => prev.filter(item => item.listingId !== listingId));

      } else {
        // --- LIKE PATH ---
        await likeListing(listingId);
        console.log(`Liked item ${listingId}`);
        // If a user likes an item *from* the likes page (e.g., in a
        // modal), we would need to re-fetch or manually add it to
        // the `likedListings` array here.
      }
    } catch (err) {
      // 7. Revert on Failure
      // If the API call fails, re-fetch all data to ensure
      // the UI reflects the true server state.
      console.error("Failed to toggle like:", err);
      setLikeError("Failed to update like. Please refresh.");
      fetchLikes(); 
    } finally {
      // 8. Cleanup
      // Always remove the item from the 'in-progress' set,
      // whether the request succeeded or failed.
      setLikingInProgress(prevSet => {
        const nextSet = new Set(prevSet);
        nextSet.delete(listingId);
        likingInProgressRef.current = nextSet;
        return nextSet;
      });
    }
  }, [fetchLikes]); // The ONLY dependency

  // --- Return Values ---
  // Expose all state and handlers for components to use.
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
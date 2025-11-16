// hooks/useLikes.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { getLikedListings, likeListing, unlikeListing } from '../services/apiService';

export default function useLikes() {
  const [likedListingIds, setLikedListingIds] = useState(new Set());
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  const [isLoadingLikes, setIsLoadingLikes] = useState(true);
  const [likeError, setLikeError] = useState(null);
  const [likedListings, setLikedListings] = useState([]);

  // Refs and Effects to keep them synced
  const likedIdsRef = useRef(likedListingIds);
  const likingInProgressRef = useRef(likingInProgress);

  useEffect(() => {
    likedIdsRef.current = likedListingIds;
  }, [likedListingIds]);

  useEffect(() => {
    likingInProgressRef.current = likingInProgress;
  }, [likingInProgress]);

  // ... fetchLikes and its useEffect are fine ...
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

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);


  // --- The Bulletproof Toggle Function ---
  const handleLikeToggle = useCallback(async (listingId) => {
    
    // 1. Solves "double-click" bug
    if (likingInProgressRef.current.has(listingId)) {
      console.log("Like action already in progress for item:", listingId);
      return;
    }
    const newLikingSet = new Set(likingInProgressRef.current).add(listingId);
    likingInProgressRef.current = newLikingSet;
    setLikingInProgress(newLikingSet);
    setLikeError(null);

    const isCurrentlyLiked = likedIdsRef.current.has(listingId);

    // 2. Optimistic UI for *ID set only*
    // This updates all like buttons (🤍 -> ❤️) immediately.
    // This is fast and does NOT cause the feedback loop.
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
    
    // 3. --- THIS IS THE FIX ---
    // We *remove* the optimistic update for setLikedListings.
    // DELETE THIS:
    // if (isCurrentlyLiked) {
    //   setLikedListings(prev => prev.filter(item => item.listingId !== listingId));
    // }
    // --- END FIX ---

    // 4. API call
    try {
      if (isCurrentlyLiked) {
        await unlikeListing(listingId);
        console.log(`Unliked item ${listingId}`);

            // --- 5. PESSIMISTIC UPDATE ---
            // Now that the API call is successful, we remove the
            // item from the list. This breaks the feedback loop.
            setLikedListings(prev => prev.filter(item => item.listingId !== listingId));

      } else {
        await likeListing(listingId);
        console.log(`Liked item ${listingId}`);
        // Note: If you "like" an item *from* the Likes page (e.g., in a
        // modal), you'd need to fetchLikes() here to add it to the list.
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setLikeError("Failed to update like. Please refresh.");
      // Revert all state on error
      fetchLikes(); 
    } finally {
      // 6. Remove from loading state
      setLikingInProgress(prevSet => {
        const nextSet = new Set(prevSet);
        nextSet.delete(listingId);
        likingInProgressRef.current = nextSet;
        return nextSet;
      });
    }
  }, [fetchLikes]); // The ONLY dependency

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
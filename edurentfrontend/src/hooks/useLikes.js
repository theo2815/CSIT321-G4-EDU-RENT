import { useState, useEffect, useCallback, useRef } from 'react';
import { getLikedListings, likeListing, unlikeListing } from '../services/apiService';

export default function useLikes() {
  
  // --- State Management ---

  const [likedListingIds, setLikedListingIds] = useState(new Set());
  
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  
  const [likedListings, setLikedListings] = useState([]);
  
  const [isLoadingLikes, setIsLoadingLikes] = useState(true);
  const [likeError, setLikeError] = useState(null);

  // --- Refs (For safety inside async functions) ---

  const likedIdsRef = useRef(likedListingIds);
  const likingInProgressRef = useRef(likingInProgress);

  useEffect(() => {
    likedIdsRef.current = likedListingIds;
  }, [likedListingIds]);

  useEffect(() => {
    likingInProgressRef.current = likingInProgress;
  }, [likingInProgress]);

  // --- Data Fetching ---

  const fetchLikes = useCallback(async () => {
    
    const token = localStorage.getItem('eduRentUserData');
    if (!token) {
        setLikedListingIds(new Set());
        setLikedListings([]);
        setIsLoadingLikes(false);
        return;
    }

    setIsLoadingLikes(true);
    setLikeError(null);
    
    try {
      const response = await getLikedListings();
      const listings = response.data || [];
      
      const likedIds = new Set(listings.map(listing => listing.listingId));
      
      setLikedListings(listings);
      setLikedListingIds(likedIds);
    } catch (err) {
      console.error("Oops, failed to fetch liked listings:", err);
      setLikeError("Could not load liked items. Please refresh.");
    } finally {
      setIsLoadingLikes(false);
    }
  }, []);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);


  // --- Event Handlers ---

  const handleLikeToggle = useCallback(async (listingId) => {
    
    if (likingInProgressRef.current.has(listingId)) {
      console.log("Hold on, we're already processing this like action:", listingId);
      return;
    }

    const newLikingSet = new Set(likingInProgressRef.current).add(listingId);
    likingInProgressRef.current = newLikingSet;
    setLikingInProgress(newLikingSet);
    setLikeError(null);

    const isCurrentlyLiked = likedIdsRef.current.has(listingId);

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
    
    try {
      if (isCurrentlyLiked) {
        await unlikeListing(listingId);
        console.log(`Successfully unliked item ${listingId}`);

        setLikedListings(prev => prev.filter(item => item.listingId !== listingId));

      } else {
        await likeListing(listingId);
        console.log(`Successfully liked item ${listingId}`);
      }
    } catch (err) {
      console.error("Failed to toggle like on server:", err);
      setLikeError("Failed to update like. Please refresh.");
      
      fetchLikes(); 
    } finally {
      setLikingInProgress(prevSet => {
        const nextSet = new Set(prevSet);
        nextSet.delete(listingId);
        likingInProgressRef.current = nextSet;
        return nextSet;
      });
    }
  }, [fetchLikes]);

  // Expose the data and functions to the rest of the app
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
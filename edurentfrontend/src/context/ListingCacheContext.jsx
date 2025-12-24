import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ListingCacheContext = createContext();

export function useListingCache() {
  return useContext(ListingCacheContext);
}

export function ListingCacheProvider({ children }) {
  // We use a Map to store listings by ID for O(1) access
  // Storing as an object/map in state
  const [cache, setCache] = useState({});
  // OPTIMIZATION: Cache seller ratings with timestamp for TTL
  const [ratingCache, setRatingCache] = useState({});
  
  // Use refs for cache access to avoid dependency issues
  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  const cacheListings = useCallback((listings) => {
    if (!listings || listings.length === 0) return;

    setCache(prevCache => {
      const newCache = { ...prevCache };
      let hasChanges = false;
      
      listings.forEach(listing => {
        if (!listing || !listing.listingId) return;
        // Only update if missing or if we want to overwrite (assuming fresh data is better)
        if (newCache[listing.listingId] !== listing) {
            newCache[listing.listingId] = listing;
            hasChanges = true;
        }
      });

      return hasChanges ? newCache : prevCache;
    });
  }, []);

  const getCachedListing = useCallback((listingId) => {
    return cacheRef.current[listingId];
  }, []);

  // OPTIMIZATION: Cache seller ratings to avoid refetching on multiple modal opens
  const cacheSellerRating = useCallback((sellerId, ratingData) => {
    if (!sellerId) return;
    setRatingCache(prev => ({
      ...prev,
      [sellerId]: {
        data: ratingData,
        timestamp: Date.now()
      }
    }));
  }, []);

  // Use ref for rating cache too
  const ratingCacheRef = useRef(ratingCache);
  ratingCacheRef.current = ratingCache;

  // Get cached rating if it exists and is not expired (5 minute TTL)
  const getCachedRating = useCallback((sellerId) => {
    if (!sellerId) return null;
    const cached = ratingCacheRef.current[sellerId];
    if (!cached) return null;
    
    const FIVE_MINUTES = 5 * 60 * 1000;
    if (Date.now() - cached.timestamp > FIVE_MINUTES) {
      return null; // Cache expired
    }
    return cached.data;
  }, []);

  return (
    <ListingCacheContext.Provider value={{ 
      cacheListings, 
      getCachedListing,
      cacheSellerRating,
      getCachedRating
    }}>
      {children}
    </ListingCacheContext.Provider>
  );
}

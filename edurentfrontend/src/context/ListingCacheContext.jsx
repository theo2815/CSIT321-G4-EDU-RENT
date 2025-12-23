import React, { createContext, useContext, useState, useCallback } from 'react';

const ListingCacheContext = createContext();

export function useListingCache() {
  return useContext(ListingCacheContext);
}

export function ListingCacheProvider({ children }) {
  // We use a Map to store listings by ID for O(1) access
  // Storing as an object/map in state
  const [cache, setCache] = useState({});

  const cacheListings = useCallback((listings) => {
    if (!listings || listings.length === 0) return;

    setCache(prevCache => {
      const newCache = { ...prevCache };
      let hasChanges = false;
      
      listings.forEach(listing => {
        if (!listing || !listing.listingId) return;
        // Only update if missing or if we want to overwrite (assuming fresh data is better)
        // We generally assume data from APIs is fresh.
        // Optimization: Check timestamps if available, but for now simple overwrite is fine
        // to ensure we have the latest "Available"/"Sold" status.
        if (newCache[listing.listingId] !== listing) {
            newCache[listing.listingId] = listing;
            hasChanges = true;
        }
      });

      return hasChanges ? newCache : prevCache;
    });
  }, []);

  const getCachedListing = useCallback((listingId) => {
    return cache[listingId];
  }, [cache]);

  return (
    <ListingCacheContext.Provider value={{ cacheListings, getCachedListing }}>
      {children}
    </ListingCacheContext.Provider>
  );
}

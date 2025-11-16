import { useMemo } from 'react';

/**
 * A hook that memoizes a filtered list based on listing type.
 * @param {Array} masterList - The full list of listings to filter.
 * @param {string} filterType - 'sale' or 'rent'.
 * @returns {Array} The memoized, filtered list.
 */
export default function useFilteredListings(masterList, filterType) {
  
  const filteredList = useMemo(() => {
    if (!filterType || filterType === 'all') {
      return masterList;
    }
    
    // --- FIX ---
    // Determine the string to match (and uppercase it)
    const typeMatch = filterType === 'sale' ? 'FOR SALE' : 'FOR RENT';

    return masterList.filter(listing => 
      // Compare uppercase to uppercase
      listing.listingType?.toUpperCase() === typeMatch
    );
    // --- END FIX ---

  }, [masterList, filterType]); // Dependencies

  return filteredList;
}
// This hooks filters a list of listings based on the selected filter type.
import { useMemo } from 'react';

// Helper to get nested values from an object using dot notation
function getDeepValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, key) => (acc && acc[key] ? acc[key] : undefined), obj);
}

export default function useFilteredListings(masterList, filterType, searchQuery = '', searchKeys = []) {
  
  const filteredList = useMemo(() => {
    let result = masterList;

    // 1. Filter by Type
    if (filterType && filterType !== 'all') {
      const typeMatch = filterType === 'sale' ? 'FOR SALE' : 'FOR RENT';
      result = result.filter(listing => 
        listing.listingType?.toUpperCase() === typeMatch
      );
    }
    
    // 2. Filter by Search Query
    if (searchQuery && searchQuery.trim() !== '' && searchKeys.length > 0) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => {
        return searchKeys.some(key => {
          const value = getDeepValue(item, key);
          return value && String(value).toLowerCase().includes(lowerQuery);
        });
      });
    }

    return result;

  }, [masterList, filterType, searchQuery, searchKeys]); // Dependencies

  return filteredList;
}
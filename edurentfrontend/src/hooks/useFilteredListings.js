// This hooks filters a list of listings based on the selected filter type.
import { useMemo } from 'react';

export default function useFilteredListings(masterList, filterType) {
  
  const filteredList = useMemo(() => {
    if (!filterType || filterType === 'all') {
      return masterList;
    }
    
    // Determine the string to match (and uppercase it)
    const typeMatch = filterType === 'sale' ? 'FOR SALE' : 'FOR RENT';

    return masterList.filter(listing => 
      // Compare uppercase to uppercase
      listing.listingType?.toUpperCase() === typeMatch
    );

  }, [masterList, filterType]); // Dependencies

  return filteredList;
}
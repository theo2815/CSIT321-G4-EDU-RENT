import { useState, useMemo } from 'react';

/**
 * A helper function to safely get a nested property value
 * (e.g., 'category.name') from an object.
 */
function getDeepValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, key) => (acc && acc[key] ? acc[key] : undefined), obj);
}

/**
 * A reusable hook for live-searching a list of objects.
 * @param {Array} masterList - The original, unfiltered list.
 * @param {Array<string>} filterKeys - Keys to search against (e.g., ['title', 'category.name']).
 */
export default function useSearch(masterList = [], filterKeys = []) {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. The event handler to be passed to an input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  // 2. Memoized filtered list
  const filteredListings = useMemo(() => {
    if (searchQuery.trim() === '') {
      return masterList; // Return all if search is empty
    }
    
    return masterList.filter(item => {
      // Check if *any* of the keys match the search query
      return filterKeys.some(key => {
        const value = getDeepValue(item, key);
        return value && String(value).toLowerCase().includes(searchQuery);
      });
    });
  }, [masterList, filterKeys, searchQuery]); // Re-filter only when these change

  // 3. Return state and handler
  return {
    searchQuery,        // The current search string
    handleSearch,       // The onChange handler for your input
    filteredListings    // The new, filtered list to display
  };
}
// This hooks provides live-search functionality over a list of items
import { useState, useMemo } from 'react';

// Helper to get nested values from an object using dot notation
function getDeepValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, key) => (acc && acc[key] ? acc[key] : undefined), obj);
}

// Main hook function
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
      return filterKeys.some(key => {
        const value = getDeepValue(item, key);
        return value && String(value).toLowerCase().includes(searchQuery);
      });
    });
  }, [masterList, filterKeys, searchQuery]); 

  // 3. Return state and handler
  return {
    searchQuery,        
    handleSearch,      
    filteredListings  
  };
}
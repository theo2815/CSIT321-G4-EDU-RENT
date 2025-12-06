import { useState, useEffect, useCallback } from 'react';
import { getListings, getCategories } from '../services/apiService';

// Removed the 'isUserAuthenticated' dependency
export default function usePageData() {
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [allListings, setAllListings] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      // Fetch listings and categories in parallel
      const listingsPromise = getListings();
      const categoriesPromise = getCategories();

      const [listingsResponse, categoriesResponse] = await Promise.all([
        listingsPromise,
        categoriesPromise,
      ]);

      setAllListings(listingsResponse.data || []);
      setCategories(categoriesResponse.data || []);

    } catch (err) {
      console.error("Failed to fetch page data:", err);
      // Only set error if it's NOT an auth error (401/403 should be ignored for public view)
      if (err.message !== "No authentication token found." && err.response?.status !== 403 && err.response?.status !== 401) {
        setDataError("Could not load page data. Please try again.");
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []); 

  // Fetch data immediately on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    allListings,    
    categories,     
    isLoadingData,  
    dataError,     
    refetchData: fetchData 
  };
}
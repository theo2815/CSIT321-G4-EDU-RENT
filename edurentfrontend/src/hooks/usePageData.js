// This hooks fetches and manages page data including listings and categories, handling loading and error states
import { useState, useEffect, useCallback } from 'react';
import { getListings, getCategories } from '../services/apiService';


export default function usePageData(isUserAuthenticated) {
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
      if (err.message !== "No authentication token found." && err.response?.status !== 403 && err.response?.status !== 401) {
        setDataError("Could not load page data. Please try again.");
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []); 

  // Fetch data only after user is authenticated
  useEffect(() => {
    if (isUserAuthenticated) {
      fetchData();
    }
    // We don't fetch if user is not authenticated
  }, [isUserAuthenticated, fetchData]);

  return {
    allListings,    
    categories,     
    isLoadingData,  
    dataError,     
    refetchData: fetchData 
  };
}
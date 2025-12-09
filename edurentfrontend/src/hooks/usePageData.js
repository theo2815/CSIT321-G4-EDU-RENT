import { useState, useEffect, useCallback } from 'react';
import { getListings, getCategories } from '../services/apiService';

// Removed the 'isUserAuthenticated' dependency
export default function usePageData() {
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [allListings, setAllListings] = useState([]);
  const [categories, setCategories] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10; // Default size
  const [hasMore, setHasMore] = useState(false);

  const fetchData = useCallback(async (page = 0) => {
    setIsLoadingData(true);
    if (page === 0) setDataError(null);
    try {
      // Fetch listings and categories in parallel
      const listingsPromise = getListings(page, 10);
      const categoriesPromise = getCategories();

      const [listingsResponse, categoriesResponse] = await Promise.all([
        listingsPromise,
        categoriesPromise,
      ]);

      const data = listingsResponse.data;

      if (data.content) {
          setAllListings(prev => page === 0 ? data.content : [...prev, ...data.content]);
          setCurrentPage(data.number);
          setTotalPages(data.totalPages);
          setHasMore(data.number < data.totalPages - 1);
      } else {
          setAllListings(data || []);
          setHasMore(false);
      }
      
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

  const loadMore = useCallback(() => {
      if (hasMore && !isLoadingData) {
          fetchData(currentPage + 1);
      }
  }, [hasMore, isLoadingData, currentPage, fetchData]);

  return {
    allListings,    
    categories,     
    isLoadingData,  
    dataError,     
    refetchData: () => fetchData(0),
    loadMore,       
    hasMore      
  };
}
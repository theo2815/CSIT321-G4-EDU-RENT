import { useState, useEffect, useCallback } from 'react';
import { getListings, getCategories } from '../services/apiService';

// Removed the 'isUserAuthenticated' dependency
export default function usePageData() {
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Separate state for load more
  const [dataError, setDataError] = useState(null);
  const [allListings, setAllListings] = useState([]);
  const [categories, setCategories] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchData = useCallback(async (page = 0, isLoadMore = false) => {
    // Use different loading states for initial load vs load more
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingData(true);
      setDataError(null);
    }

    try {
      // Fetch listings and categories in parallel
      const listingsPromise = getListings(page, 8);
      const categoriesPromise = page === 0 ? getCategories() : Promise.resolve({ data: categories });

      const [listingsResponse, categoriesResponse] = await Promise.all([
        listingsPromise,
        categoriesPromise,
      ]);

      const data = listingsResponse.data;

      if (data.content) {
          setAllListings(prev => page === 0 ? data.content : [...prev, ...data.content]);
          setCurrentPage(data.number);
          setHasMore(data.number < data.totalPages - 1);
      } else {
          setAllListings(data || []);
          setHasMore(false);
      }
      
      if (page === 0) {
        setCategories(categoriesResponse.data || []);
      }

    } catch (err) {
      console.error("Failed to fetch page data:", err);
      // Only set error if it's NOT an auth error (401/403 should be ignored for public view)
      if (err.message !== "No authentication token found." && err.response?.status !== 403 && err.response?.status !== 401) {
        setDataError("Could not load page data. Please try again.");
      }
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoadingData(false);
      }
    }
  }, [categories]); 

 // Fetch data immediately on mount
  useEffect(() => {
    fetchData(0, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
      if (hasMore && !isLoadingMore) {
          fetchData(currentPage + 1, true); // Pass true to indicate "load more"
      }
  }, [hasMore, isLoadingMore, currentPage, fetchData]);

  return {
    allListings,    
    categories,     
    isLoadingData,  // For initial page load skeleton
    isLoadingMore,  // For load more button loading state
    dataError,     
    refetchData: () => fetchData(0, false),
    loadMore,       
    hasMore      
  };
}

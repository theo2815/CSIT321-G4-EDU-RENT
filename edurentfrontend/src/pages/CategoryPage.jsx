import React, { useState, useEffect } from 'react'; 
import { useParams, useNavigate, Link } from 'react-router-dom';

// Import our custom hooks
import useAuth from '../hooks/useAuth';
import usePageLogic from '../hooks/usePageLogic';
import useSearch from '../hooks/useSearch';
import useLikes from '../hooks/useLikes';

// Import UI components
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import PaginationControls from '../components/PaginationControls';
import LoadMoreButton from '../components/LoadMoreButton';

// Import API functions needed for this specific page
import { getCategories, getListingsByCategoryId } from '../services/apiService';

// Import styles
import '../static/CategoryPage.css';
import '../static/BrowsePage.css'; 
import '../static/DashboardPage.css'; 

// Simple SVG icon for the search bar
const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  ),
};

export default function CategoryPage() {
  const { categoryId } = useParams(); 
  const navigate = useNavigate();

  // Get the current user's session data
  const { userData, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Handle the logic for liking items
  const likesHook = useLikes();
  const { 
    likedListingIds, 
    likingInProgress, 
    isLoadingLikes, 
    likeError, 
    handleLikeToggle,
    refetchLikes
  } = likesHook;

  // Manage UI elements like the detail modal and notifications
  const { 
    openModal,
    handleNotificationClick, 
    ModalComponent
  } = usePageLogic(userData, likesHook); 

  // Store the category details and the list of items locally
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [categoryListings, setCategoryListings] = useState([]); 
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [pageDataError, setPageDataError] = useState(null);

  // Enable searching within this specific category list
  const { searchQuery, handleSearch, filteredListings } = useSearch(
    categoryListings,
    ['title', 'description'] 
  );
  
  // Fetch the category name and its listings when the page loads
  useEffect(() => {
    if (!categoryId) return;

    const fetchData = async (page = 0) => {
      setIsLoadingPageData(true);
      setPageDataError(null);
      const catIdNumber = parseInt(categoryId, 10);

      if (isNaN(catIdNumber)) {
          setPageDataError("Invalid category specified.");
          setIsLoadingPageData(false);
          return;
      }

      try {
        // Fetch both the full category list (to get the name) and the specific items
        const categoriesPromise = getCategories(); 
        const listingsPromise = getListingsByCategoryId(catIdNumber, page, 8);

        const [categoriesResponse, listingsResponse] = await Promise.all([
          categoriesPromise,
          listingsPromise,
        ]);

        // Find the matching category object
        const allCategories = categoriesResponse.data || [];
        const currentCategory = allCategories.find(cat => cat.categoryId === catIdNumber);
        
        if (!currentCategory) {
            throw new Error(`Category with ID ${catIdNumber} not found.`);
        }
        setCategoryInfo(currentCategory);

        // Save the items found in this category
        setCategoryListings(listingsResponse.data || []);

        // Handle Page response
        const data = listingsResponse.data;
        if (data.content) {
            setCategoryListings(prev => page === 0 ? data.content : [...prev, ...data.content]);
            setTotalPages(data.totalPages);
            setCurrentPage(data.number);
            setHasMore(data.number < data.totalPages - 1);
        } else {
            setCategoryListings(data || []);
            setHasMore(false);
        }

      } catch (err) {
        console.error("Failed to fetch category data:", err);
        let errorMsg = err.message || "Could not load category data. Please try again.";
        if (err.response?.status === 404) {
          errorMsg = `Category with ID ${catIdNumber} not found.`;
        }
        setPageDataError(errorMsg);
      } finally {
        setIsLoadingPageData(false);
      }
    };
    
    if (categoryId) fetchData(0);
  }, [categoryId]); 

  // Check if any part of the page is loading or has failed
  const isPageLoading = isLoadingAuth || isLoadingPageData || isLoadingLikes;
  const pageError = authError || pageDataError || likeError;

  // Try to fix errors by reloading specific parts or the whole page
  const handleRetry = () => {
    if (authError) retryAuth();
    if (likeError) refetchLikes();
    if (pageDataError) {
       window.location.reload(); 
    }
  };

  // Show a loading skeleton while waiting for data
  if (isPageLoading) {
    return (
        <div className="profile-page">
            <Header userName="" onLogout={logout} />
            <main className="category-page-container">
                <div className="category-page-header skeleton" style={{ height: '2.5rem', width: '200px', marginBottom: '1.5rem' }}></div>
                <div className="browse-search-bar skeleton" style={{ height: '60px', marginBottom: '2rem' }}></div>
                <ListingGridSkeleton count={6} />
            </main>
        </div>
    );
  }

  // Display error message if something went wrong
  if (pageError) {
     return (
        <div className="profile-page">
            <Header userName={userName} onLogout={logout} />
            <main className="category-page-container">
                <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>Error: {pageError}</div>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button onClick={handleRetry} className="error-retry-btn">Try Again</button>
                    <Link to="/dashboard" className="cta-button" style={{marginLeft: '1rem'}}>Back to Dashboard</Link>
                </div>
            </main>
        </div>
     );
  }

  return (
    <div className="profile-page">
      <Header
        userName={userName}        
        profilePictureUrl={userData?.profilePictureUrl}
        onLogout={logout}        
        searchQuery=""            
        onSearchChange={()=>{}}   
        onNotificationClick={handleNotificationClick} 
      />

      <main className="category-page-container">
        <div className="category-page-header">
            <h1 className="category-page-title">
              {/* Show the category icon, or a default box if none exists */}
              {categoryInfo?.icon && <span style={{ marginRight: '0.5rem' }}>{categoryInfo.icon}</span>}
              {!categoryInfo?.icon && <span style={{ marginRight: '0.5rem' }}>📦</span>} 
              {categoryInfo?.name || 'Category'}
            </h1>
        </div>

        {/* Search within this category */}
        <div className="browse-search-bar" style={{marginBottom: '2rem'}}>
           <span className="browse-search-icon"><Icons.Search /></span>
           <input
             type="text"
             className="browse-search-input"
             placeholder={`Search in ${categoryInfo?.name || 'this category'}...`}
             value={searchQuery}       
             onChange={handleSearch}   
             aria-label={`Search items in ${categoryInfo?.name}`}
           />
        </div>

        <section>
          {/* List the filtered items */}
          {filteredListings.length > 0 ? (
            <div className="listing-grid">
              {filteredListings.map(listing => (
                <ListingCard
                  key={listing.listingId} 
                  listing={listing}
                  onClick={openModal}                   
                  isLiked={likedListingIds.has(listing.listingId)} 
                  onLikeClick={handleLikeToggle}        
                  isOwner={userData?.userId === listing.user?.userId} 
                  currentUserId={userData?.userId}      
                  isLiking={likingInProgress.has(listing.listingId)} 
                />
              ))}
            </div>
          ) : (
            // Show this if the search or category is empty
            <div className="empty-state">
               <div className="empty-state-icon">{categoryInfo?.icon || '📂'}</div>
               <div className="empty-state-title">No Listings Found</div>
               <p>
                 There are currently no items listed in the "{categoryInfo?.name || 'selected'}" category
                 {searchQuery ? ' matching your search' : ''}.
               </p>
                <Link to="/dashboard" className="cta-button" style={{marginTop: '1rem'}}>Back to Dashboard</Link>
            </div>
          )}
          {filteredListings.length > 0 && (
              <LoadMoreButton 
                onLoadMore={() => fetchData(currentPage + 1)}
                isLoading={isLoadingPageData}
                hasMore={hasMore}
              />
          )}
        </section>
      </main>

      {/* Render the item detail modal when needed */}
      <ModalComponent />
    </div>
  );
}
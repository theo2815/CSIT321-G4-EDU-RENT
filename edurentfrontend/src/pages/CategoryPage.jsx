import React, { useState, useEffect } from 'react'; // Keep useState/useEffect for local data
import { useParams, useNavigate, Link } from 'react-router-dom';

// --- Import Hooks ---
import useAuth from '../hooks/useAuth';
import usePageLogic from '../hooks/usePageLogic';
import useSearch from '../hooks/useSearch';
import useLikes from '../hooks/useLikes';
// We don't use usePageData here, as this page has custom data-fetching needs.

// --- Import Components ---
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
// ProductDetailModal and Skeleton are now handled internally by usePageLogic

// --- Import API Functions (for this page's specific logic) ---
import { getCategories, getListingsByCategoryId } from '../services/apiService';

// --- Import CSS ---
import '../static/CategoryPage.css';
import '../static/BrowsePage.css'; // For search bar
import '../static/DashboardPage.css'; // For grid and empty state

// --- SVG Icon Component ---
const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  ),
};

// --- Main Page Component ---
export default function CategoryPage() {
  const { categoryId } = useParams(); // Get category ID from the URL
  const navigate = useNavigate();

  // 1. Authentication Hook: Manages user data and login status.
  const { userData, userName, isLoadingAuth, authError, logout, retryAuth } = useAuth();
  
  // 2. Likes Hook: Manages all like-related state and logic.
  const likesHook = useLikes();
  const { 
    likedListingIds, 
    likingInProgress, 
    isLoadingLikes, 
    likeError, 
    handleLikeToggle,
    refetchLikes
  } = likesHook;

  // 3. Page Logic Hook: Manages modals and notifications.
  // It receives 'likesHook' to pass all like data to the modal.
  const { 
    openModal,
    handleNotificationClick, 
    ModalComponent
  } = usePageLogic(userData, likesHook); // <-- Pass the whole likesHook in

  // 4. Local State: Manages data specific *only* to this category page.
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [categoryListings, setCategoryListings] = useState([]); // Master list for this category
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [pageDataError, setPageDataError] = useState(null);

  // 5. Search Hook: Takes the local 'categoryListings' and makes them searchable.
  const { searchQuery, handleSearch, filteredListings } = useSearch(
    categoryListings,
    ['title', 'description'] // Only search title and description
  );
  
  // --- Local Data Fetching ---
  // This useEffect runs when the user or categoryId changes.
  useEffect(() => {
    if (!userData || !categoryId) return; // Wait for user and category ID

    const fetchData = async () => {
      setIsLoadingPageData(true);
      setPageDataError(null);
      const catIdNumber = parseInt(categoryId, 10);

      if (isNaN(catIdNumber)) {
          setPageDataError("Invalid category specified.");
          setIsLoadingPageData(false);
          return;
      }

      try {
        // Fetch category info and the listings for that category
        const categoriesPromise = getCategories(); // Fetch all to find the name
        const listingsPromise = getListingsByCategoryId(catIdNumber);

        const [categoriesResponse, listingsResponse] = await Promise.all([
          categoriesPromise,
          listingsPromise,
        ]);

        // Find the current category's name from the full list
        const allCategories = categoriesResponse.data || [];
        const currentCategory = allCategories.find(cat => cat.categoryId === catIdNumber);
        
        if (!currentCategory) {
            throw new Error(`Category with ID ${catIdNumber} not found.`);
        }
        setCategoryInfo(currentCategory);

        // Set the master list of listings for this category
        setCategoryListings(listingsResponse.data || []);

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
    
    fetchData();
  }, [categoryId, userData]); // Re-run if category or user changes

  // Combine loading and error states from hooks and local state
  const isPageLoading = isLoadingAuth || isLoadingPageData || isLoadingLikes;
  const pageError = authError || pageDataError || likeError;

  // This handler can retry auth, likes, or this page's specific data
  const handleRetry = () => {
    if (authError) retryAuth();
    if (likeError) refetchLikes();
    if (pageDataError) {
       // Re-run the local useEffect logic by triggering a re-render
       // (This is a simple way to force the effect to run again)
       // A more complex solution would be to move fetchData outside useEffect,
       // but for this case, a reload is simple and effective.
       window.location.reload(); 
    }
  };

  // --- Loading State ---
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

  // --- Error State ---
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

  // --- Main Page Render ---
  return (
    <div className="profile-page">
      <Header
        userName={userName}         // From useAuth
        profilePictureUrl={userData?.profilePictureUrl}
        onLogout={logout}         // From useAuth
        searchQuery=""            // Disable header search
        onSearchChange={()=>{}}   // Disable header search
        onNotificationClick={handleNotificationClick} // From usePageLogic
      />

      <main className="category-page-container">
        <div className="category-page-header">
            <h1 className="category-page-title">
              {/* Display category icon (using your original logic) */}
              {categoryInfo?.icon && <span style={{ marginRight: '0.5rem' }}>{categoryInfo.icon}</span>}
              {!categoryInfo?.icon && <span style={{ marginRight: '0.5rem' }}>📦</span>} 
              {categoryInfo?.name || 'Category'}
            </h1>
        </div>

        {/* This page has its own search bar */}
        <div className="browse-search-bar" style={{marginBottom: '2rem'}}>
           <span className="browse-search-icon"><Icons.Search /></span>
           <input
             type="text"
             className="browse-search-input"
             placeholder={`Search in ${categoryInfo?.name || 'this category'}...`}
             value={searchQuery}       // From useSearch
             onChange={handleSearch}   // From useSearch
             aria-label={`Search items in ${categoryInfo?.name}`}
           />
        </div>

        <section>
          {/* Display the final filtered list from useSearch */}
          {filteredListings.length > 0 ? (
            <div className="listing-grid">
              {filteredListings.map(listing => (
                <ListingCard
                  key={listing.listingId} 
                  listing={listing}
                  onClick={openModal}                   // From usePageLogic
                  isLiked={likedListingIds.has(listing.listingId)} // From usePageLogic
                  onLikeClick={handleLikeToggle}        // From usePageLogic
                  isOwner={userData?.userId === listing.user?.userId} // Prop from original code
                  currentUserId={userData?.userId}      // From useAuth
                  isLiking={likingInProgress.has(listing.listingId)} // From usePageLogic
                />
              ))}
            </div>
          ) : (
            // Empty state (using your original logic)
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
        </section>
      </main>

      {/* Modal rendering is now handled by this single component from usePageLogic */}
      <ModalComponent />
    </div>
  );
}
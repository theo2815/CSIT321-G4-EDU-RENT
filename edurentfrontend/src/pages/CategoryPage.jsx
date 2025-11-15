import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';
// Import all necessary API functions, including for "likes"
import { 
  getCurrentUser, 
  getCategories,
  getListingsByCategoryId,
  getLikedListings,
  likeListing,
  getListingById,
  unlikeListing
} from '../services/apiService';

// Import CSS
import '../static/CategoryPage.css';
import '../static/BrowsePage.css'; // For search bar style
import '../static/DashboardPage.css'; // For listing grid, empty state, CTA

const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  ),
};

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [userName, setUserName] = useState('');
  const [userData, setUserData] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [categoryListings, setCategoryListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // State to track liked item IDs for fast lookups
  const [likedListingIds, setLikedListingIds] = useState(new Set());

  /**
   * Fetches user data, category info, category listings, and liked listings in parallel.
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const catIdNumber = parseInt(categoryId, 10);

    if (isNaN(catIdNumber)) {
        setError("Invalid category specified.");
        setIsLoading(false);
        return;
    }

    try {
      // Set up all data requests in parallel
      const userPromise = getCurrentUser();
      const categoriesPromise = getCategories();
      const listingsPromise = getListingsByCategoryId(catIdNumber);
      const likesPromise = getLikedListings(); // Added like request

      // Await all promises
      // <--- THIS IS THE FIX: Changed 'likesResponse' to 'likesPromise' in the array
      const [userResponse, categoriesResponse, listingsResponse, likesResponse] = await Promise.all([
        userPromise,
        categoriesPromise,
        listingsPromise,
        likesPromise // <-- Was 'likesResponse', which caused the error
      ]);

      // Process user
      setUserData(userResponse.data);
      if (userResponse.data && userResponse.data.fullName) {
        setUserName(userResponse.data.fullName.split(' ')[0]);
      } else {
          setUserName('User');
      }

      // Process category info (find name from all categories)
      const allCategories = categoriesResponse.data || [];
      const currentCategory = allCategories.find(cat => cat.categoryId === catIdNumber);
      if (!currentCategory) {
          throw new Error(`Category with ID ${catIdNumber} not found.`);
      }
      setCategoryInfo(currentCategory);

      // Process listings
      setCategoryListings(listingsResponse.data || []);
      setFilteredListings(listingsResponse.data || []);

      // Process Liked Listings
      const likedIds = new Set(likesResponse.data.map(listing => listing.listingId));
      setLikedListingIds(likedIds);

    } catch (err) {
      console.error("Failed to fetch category data:", err);
      let errorMsg = err.message || "Could not load category data. Please try again.";
      if (err.response?.status === 404) {
        errorMsg = `Category with ID ${catIdNumber} not found.`;
      }
      if (err.message === "No authentication token found." || err.response?.status === 401 || err.response?.status === 403) {
          errorMsg = "Please log in to view this page.";
          setTimeout(() => navigate('/login'), 1500);
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, navigate]);

  // Fetch data on component mount or when fetchData changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Filters the 'categoryListings' based on the search query.
   */
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = categoryListings.filter(listing =>
      listing.title.toLowerCase().includes(query) ||
      listing.description.toLowerCase().includes(query)
    );
    setFilteredListings(filtered);
  };

  /**
   * Logs the user out and navigates to the login page.
   */
  const handleLogout = () => {
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  /**
   * Fetches the full listing data and opens the modal, showing a skeleton first.
   */
  const handleOpenListing = async (listingId) => {
    if (!listingId) {
      console.error("No listing ID provided");
      return;
    }
    
    // Close any modal that's already open and show skeleton
    closeModal(); 
    setIsModalLoading(true);

    try {
      console.log(`Fetching details for listingId: ${listingId}`);
      const response = await getListingById(listingId); 

      if (response.data) {
        // We found the data! Set it and open the real modal.
        setSelectedListing(response.data);
        setIsModalOpen(true);
      } else {
        throw new Error(`Listing ${listingId} not found.`);
      }

    } catch (err) {
      console.error("Failed to fetch listing for modal:", err);
      alert(`Could not load item: ${err.message}.`);
    } finally {
      // Always hide the skeleton
      setIsModalLoading(false); 
    }
  };

  /**
   * Opens the product detail modal with the selected listing.
   */
  const openModal = (listing) => {
    // Just call the new handler with the ID
    handleOpenListing(listing.listingId);
  };

  /**
   * Closes the product detail modal.
   */
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedListing(null);
  };

  /**
   * Toggles the "like" status of a listing with an optimistic update.
   */
  const handleLikeToggle = async (listingId) => {
      // --- NEW: Prevent spam clicks ---
      if (likingInProgress.has(listingId)) {
        console.log("Like action already in progress for item:", listingId);
        return; // Do nothing
      }
      // --------------------------------
  
      // 1. Add to loading state
      setLikingInProgress(prev => new Set(prev).add(listingId));
  
      // 2. Optimistic update
      const newLikedIds = new Set(likedListingIds);
      const isCurrentlyLiked = likedListingIds.has(listingId);
  
      if (isCurrentlyLiked) {
        newLikedIds.delete(listingId);
      } else {
        newLikedIds.add(listingId);
      }
      setLikedListingIds(newLikedIds);
  
      // 3. API call
      try {
        if (isCurrentlyLiked) {
          await unlikeListing(listingId);
          console.log(`Unliked item ${listingId}`);
        } else {
          await likeListing(listingId);
          console.log(`Liked item ${listingId}`);
        }
      } catch (err) {
        console.error("Failed to toggle like:", err);
        // Revert state on error
        setError("Failed to update like. Please refresh.");
        setLikedListingIds(prevIds => {
            const revertedIds = new Set(prevIds);
            if (isCurrentlyLiked) revertedIds.add(listingId);
            else revertedIds.delete(listingId);
            return revertedIds;
        });
      } finally {
        // 4. Remove from loading state
        setLikingInProgress(prev => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      }
    };

  // --- NEW Universal Notification Click Handler ---
  const handleNotificationClick = async (notification) => {
    console.log("Notification clicked:", notification);

    // 1. Extract the listing ID
    const urlParts = notification.linkUrl?.split('/');
    const listingId = urlParts ? parseInt(urlParts[urlParts.length - 1], 10) : null;

    if (!listingId) {
      console.error("Could not parse listingId from notification linkUrl:", notification.linkUrl);
      alert("Could not open this notification: Invalid link.");
      return;
    }

    // 2. Call the new master function
    handleOpenListing(listingId); 
  };
  // --- End new function ---

  if (isLoading) {
    return (
        <div className="profile-page">
            <Header userName="" onLogout={handleLogout} />
            <main className="category-page-container">
                <div className="category-page-header skeleton" style={{ height: '2.5rem', width: '200px', marginBottom: '1.5rem' }}></div>
                <div className="browse-search-bar skeleton" style={{ height: '60px', marginBottom: '2rem' }}></div>
                <ListingGridSkeleton count={6} />
            </main>
        </div>
    );
  }

  if (error) {
     return (
        <div className="profile-page">
            <Header userName={userName} onLogout={handleLogout} />
            <main className="category-page-container">
                <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>Error: {error}</div>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Link to="/dashboard" className="cta-button">Back to Dashboard</Link>
                </div>
            </main>
        </div>
     );
  }

  return (
    <div className="profile-page">
      <Header
        userName={userName}
        onLogout={handleLogout}
        searchQuery=""
        onSearchChange={()=>{}} // Header search is disabled on this page
        onNotificationClick={handleNotificationClick}
      />

      <main className="category-page-container">
        <div className="category-page-header">
            <h1 className="category-page-title">
              {categoryInfo?.icon && <span style={{ marginRight: '0.5rem' }}>{categoryInfo.icon}</span>}
              {!categoryInfo?.icon && <span style={{ marginRight: '0.5rem' }}>📦</span>} 
              {categoryInfo?.name || 'Category'}
            </h1>
        </div>

        {/* Search Bar (Specific to this category) */}
        <div className="browse-search-bar" style={{marginBottom: '2rem'}}>
           <span className="browse-search-icon"><Icons.Search /></span>
           <input
             type="text"
             className="browse-search-input"
             placeholder={`Search in ${categoryInfo?.name || 'this category'}...`}
             value={searchQuery}
             onChange={handleSearchChange}
             aria-label={`Search items in ${categoryInfo?.name}`}
           />
        </div>

        <section>
          {filteredListings.length > 0 ? (
            <div className="listing-grid">
              {filteredListings.map(listing => (
                <ListingCard
                  key={listing.listingId} 
                  listing={listing}
                  onClick={openModal}
                  // Pass like and owner status to the card
                  isLiked={likedListingIds.has(listing.listingId)}
                  onLikeClick={handleLikeToggle}
                  isOwner={userData?.userId === listing.user?.userId}
                  currentUserId={userData?.userId}
                  isLiking={likingInProgress.has(listing.listingId)}
                />
              ))}
            </div>
          ) : (
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

      

       {/* Pass like status and handler to the modal */}
       {isModalOpen && selectedListing && (
         <ProductDetailModal 
            listing={selectedListing} 
            onClose={closeModal} 
            currentUserId={userData?.userId}
            isLiked={likedListingIds.has(selectedListing.listingId)}
            onLikeClick={handleLikeToggle}
            isLiking={likingInProgress.has(selectedListing.listingId)}
         />
       )}
       {isModalLoading && (
          <ProductDetailModalSkeleton onClose={() => setIsModalLoading(false)} />
        )}
    </div>
  );
}
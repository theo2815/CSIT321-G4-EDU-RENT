import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';
// Import all necessary API functions
import {
  getCurrentUser,
  getListings,
  getCategories,
  getLikedListings,
  likeListing,
  getListingById,
  unlikeListing
} from '../services/apiService';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import ProductDetailModal from '../components/ProductDetailModal';

// Import CSS
import '../static/BrowsePage.css';
import '../static/DashboardPage.css'; // For shared grid and card styles

const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  ),
};

export default function BrowsePage() {
  const [userName, setUserName] = useState('');
  const [userData, setUserData] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  const [isModalLoading, setIsModalLoading] = useState(false);
  const navigate = useNavigate();

  // State to track liked item IDs for fast lookups
  const [likedListingIds, setLikedListingIds] = useState(new Set());

  /**
   * Fetches all necessary data for the page in parallel.
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel
      const userPromise = getCurrentUser();
      const listingsPromise = getListings();
      const categoriesPromise = getCategories();
      const likesPromise = getLikedListings(); // Fetch liked listings

      const [userResponse, listingsResponse, categoriesResponse, likesResponse] = await Promise.all([
        userPromise,
        listingsPromise,
        categoriesPromise,
        likesPromise
      ]);

      setUserData(userResponse.data);
      if (userResponse.data && userResponse.data.fullName) {
        setUserName(userResponse.data.fullName.split(' ')[0]);
      } else {
        setUserName('User');
      }

      setAllListings(listingsResponse.data || []);
      setFilteredListings(listingsResponse.data || []);
      setCategories(categoriesResponse.data || []);

      // Populate the liked IDs set
      const likedIds = new Set(likesResponse.data.map(listing => listing.listingId));
      setLikedListingIds(likedIds);

    } catch (err) {
      console.error("Failed to fetch data:", err);
      let errorMsg = "Could not load data. Please try again.";
      if (err.message === "No authentication token found." || err.response?.status === 403 || err.response?.status === 401) {
        errorMsg = "Please log in to view this page.";
        setTimeout(() => navigate('/login'), 1500);
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Filters listings based on the search query.
   */
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = allListings.filter(listing => {
      const titleMatch = listing.title.toLowerCase().includes(query);
      const descriptionMatch = listing.description.toLowerCase().includes(query);
      // Ensure category exists before trying to access its name
      const categoryMatch = listing.category && listing.category.name && 
                            listing.category.name.toLowerCase().includes(query);
      return titleMatch || descriptionMatch || categoryMatch;
    });
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

  // Filter listings for display; use optional chaining for safety
  const saleListings = filteredListings.filter(l => l.listingType?.toUpperCase().includes('SALE'));
  const rentListings = filteredListings.filter(l => l.listingType?.toUpperCase().includes('RENT'));

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
            <Header userName="" onLogout={handleLogout} searchQuery="" onSearchChange={()=>{}} />
            <main className="browse-page-container">
                <div className="browse-search-bar skeleton" style={{ height: '60px', marginBottom: '2rem' }}></div>
                <section className="browse-section">
                    <div className="skeleton skeleton-listing-text" style={{ height: '2.5rem', width: '200px', marginBottom: '1.5rem' }}></div>
                    <ListingGridSkeleton count={4} />
                </section>
                <section className="browse-section">
                    <div className="skeleton skeleton-listing-text" style={{ height: '2.5rem', width: '200px', marginBottom: '1.5rem' }}></div>
                    <ListingGridSkeleton count={4} />
                </section>
            </main>
        </div>
    );
  }

  if (error) {
     return (
        <div className="profile-page">
            <Header userName={userName} onLogout={handleLogout} searchQuery="" onSearchChange={()=>{}} />
            <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>Error: {error}</div>
        </div>
     );
  }

  return (
    <div className="profile-page">
      <Header
        userName={userName}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onNotificationClick={handleNotificationClick}
      />

      <main className="browse-page-container">
        {/* Search Bar */}
        <div className="browse-search-bar">
           <span className="browse-search-icon"><Icons.Search /></span>
           <input
             type="text"
             className="browse-search-input"
             placeholder="Search for textbooks, electronics, and more..."
             value={searchQuery}
             onChange={handleSearchChange}
             aria-label="Search all listings"
           />
        </div>

        {/* For Sale Section */}
        <section className="browse-section">
          <h2 className="browse-section-title">For Sale</h2>
          {saleListings.length > 0 ? (
            <div className="listing-grid">
              {saleListings.map(listing => (
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
            <p style={{ color: 'var(--text-muted)' }}>No items found for sale {searchQuery ? 'matching your search' : ''}.</p>
          )}
        </section>

        {/* For Rent Section */}
        <section className="browse-section">
          <h2 className="browse-section-title">For Rent</h2>
           {rentListings.length > 0 ? (
            <div className="listing-grid">
              {rentListings.map(listing => (
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
            <p style={{ color: 'var(--text-muted)' }}>No items found for rent {searchQuery ? 'matching your search' : ''}.</p>
          )}
        </section>

        {/* Call to Action Card */}
        <section className="content-card cta-card">
          <h2 className="cta-title">Have items to sell or rent?</h2>
          <p className="cta-subtitle">
            Turn your unused items into cash by listing them on Edu-Rent.
          </p>
          <Link to="/list-item" className="cta-button">Start Selling Today</Link>
        </section>
      </main>

      {/* Pass like status and handler to the modal as well */}
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
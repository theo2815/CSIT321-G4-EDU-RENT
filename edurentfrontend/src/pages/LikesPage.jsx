import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';
// Import all necessary API functions for this page
import {
  getCurrentUser,
  getLikedListings,
  likeListing,
  getListingById,
  unlikeListing 
} from '../services/apiService';

// Import CSS
import '../static/LikesPage.css';
import '../static/DashboardPage.css'; // For shared grid and empty state styles

export default function LikesPage() {
  const [userName, setUserName] = useState('');
  const [userData, setUserData] = useState(null); // Store full user object
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [likedListings, setLikedListings] = useState([]); // Store full liked listing objects
  
  // State to track liked item IDs for fast lookups
  const [likedListingIds, setLikedListingIds] = useState(new Set());
  const [isModalLoading, setIsModalLoading] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  /**
   * Fetches the current user and their full list of liked items.
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch user and liked listings in parallel
      const userPromise = getCurrentUser();
      const likesPromise = getLikedListings(); // Use API

      const [userResponse, likesResponse] = await Promise.all([
        userPromise,
        likesPromise
      ]);

      // Process user
      setUserData(userResponse.data);
      if (userResponse.data && userResponse.data.fullName) {
        setUserName(userResponse.data.fullName.split(' ')[0]);
      } else {
        setUserName('User');
      }

      // Process liked listings
      const likedItems = likesResponse.data || [];
      setLikedListings(likedItems); // Set the full listing objects

      // Populate the set of liked IDs
      const likedIds = new Set(likedItems.map(listing => listing.listingId));
      setLikedListingIds(likedIds);

    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Could not load your liked items. Please try again.");
      if (err.message === "No authentication token found." || err.response?.status === 401 || err.response?.status === 403) {
         navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
   * Toggles the "like" status. On this page, this function only
   * handles "unliking" and removes the item from the view optimistically.
   */
  const handleLikeToggle = async (listingId) => {
    // Optimistic Update: Remove from UI immediately
    setLikedListings(prevListings => 
      prevListings.filter(listing => listing.listingId !== listingId)
    );
    setLikedListingIds(prevIds => {
      const newIds = new Set(prevIds);
      newIds.delete(listingId);
      return newIds;
    });

    // API Call
    try {
      // Only call unlike, as items here are always liked to begin with
      await unlikeListing(listingId); 
      console.log(`Unliked item ${listingId}`);
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setError("Failed to update like. Please refresh.");
      // Revert state on error by re-fetching all data
      fetchData(); 
    }
  };

  /**
   * Renders the main content of the page based on loading, error, or data state.
   */
  const renderContent = () => {
    if (isLoading) {
      return <ListingGridSkeleton count={4} />;
    }
    if (error) {
      return <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>;
    }
    if (likedListings.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">❤️</div>
          <div className="empty-state-title">No Favorites Yet</div>
          <p>Find something you like and tap the heart to save it.</p>
          <Link to="/browse" className="cta-button" style={{marginTop: '1rem'}}>
            Browse all items
          </Link>
        </div>
      );
    }
    return (
      <div className="listing-grid">
        {likedListings.map(listing => (
          <ListingCard
            key={listing.listingId}
            listing={listing}
            onClick={openModal}
            // isLiked is always true for items on this page
            isLiked={true} 
            // onLikeClick will *unlike* and remove the item from this view
            onLikeClick={handleLikeToggle}
            // Pass ownership status to the card
            isOwner={userData?.userId === listing.user?.userId}
          />
        ))}
      </div>
    );
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

  return (
    <div className="profile-page">
      <Header
        userName={userName}
        onLogout={handleLogout}
        searchQuery=""
        onSearchChange={() => {}} // No search bar functionality on this page
        onNotificationClick={handleNotificationClick}
      />

      <main className="likes-page-container">
        <h1 className="likes-page-title">❤️ Likes</h1>
        {renderContent()}
      </main>

      {/* Pass full like-functionality props to the modal */}
      {isModalOpen && selectedListing && (
        <ProductDetailModal
          listing={selectedListing}
          onClose={closeModal}
          currentUserId={userData?.userId}
          // The modal needs the *dynamic* like status
          isLiked={likedListingIds.has(selectedListing.listingId)} 
          onLikeClick={handleLikeToggle}
        />
      )}
      {isModalLoading && (
        <ProductDetailModalSkeleton onClose={() => setIsModalLoading(false)} />
      )}

    </div>
  );
}
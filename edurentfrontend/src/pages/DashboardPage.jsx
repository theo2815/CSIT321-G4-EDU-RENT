import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, getListings, getCategories, getLikedListings, likeListing, getListingById, unlikeListing } from '../services/apiService';
import ProductDetailModal from '../components/ProductDetailModal';
import ListingCard from '../components/ListingCard';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';
import ListingGridSkeleton from '../components/ListingGridSkeleton'; 
import '../static/DashboardPage.css';
import Header from '../components/Header'; 

function LoadingSkeleton() {
  return (
    <div className="dashboard-body">
      {/* 1. Hero Card Skeleton (same as before) */}
      <div className="content-card skeleton skeleton-hero"></div>

      {/* 2. Category Skeleton (same as before) */}
      <section>
        <div className="skeleton skeleton-text large" style={{ width: '200px', height: '1.75rem', marginBottom: '1.5rem' }}></div>
        <div className="category-grid">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton skeleton-text" style={{ height: '80px', borderRadius: '8px' }}></div>
          ))}
        </div>
      </section>

      {/* 3. NEW: Featured Items Skeleton */}
      <section>
        <div className="skeleton skeleton-text large" style={{ width: '250px', height: '1.75rem', marginBottom: '1.5rem' }}></div>
        <ListingGridSkeleton count={3} /> {/* Show 3 for featured */}
      </section>

      {/* 4. NEW: All Listings Skeleton */}
      <section>
        <div className="skeleton skeleton-text large" style={{ width: '200px', height: '1.75rem', marginBottom: '1.5rem' }}></div>
        <ListingGridSkeleton count={6} /> {/* Show 6 (or more) for all */}
      </section>
    </div>
  );
}

function ErrorBoundary({ error, onRetry }) {
  return (
    <div className="error-container">
      <div className="error-title">⚠️ Something went wrong</div>
      <div className="error-message">{error}</div>
      <button className="error-retry-btn" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

function CategoryCardComponent({ category }) {
  return (
    <Link to={`/category/${category.categoryId}`} style={{ textDecoration: 'none' }}> 
      <div className="category-card">
        <div style={{ textAlign: 'center' }}>
          <div>{category.name}</div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const [likedListingIds, setLikedListingIds] = useState(new Set());
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  const [isModalLoading, setIsModalLoading] = useState(false);
  
  

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userPromise = getCurrentUser();
      const listingsPromise = getListings();
      const categoriesPromise = getCategories();
      const likesPromise = getLikedListings();

      // <--- FIX: Added 'likesResponse' to the destructuring array
      const [userResponse, listingsResponse, categoriesResponse, likesResponse] = await Promise.all([
        userPromise,
        listingsPromise,
        categoriesPromise,
        likesPromise,
      ]);

      setUserData(userResponse.data);

      if (userResponse.data && userResponse.data.fullName) {
        setUserName(userResponse.data.fullName.split(' ')[0]);
      } else {
        setUserName('User');
      }

      console.log("Fetched listings:", listingsResponse.data);
      setAllListings(listingsResponse.data || []);
      setListings(listingsResponse.data || []);

      console.log("Fetched categories:", categoriesResponse.data);
      setCategories(categoriesResponse.data || []);

      // <--- FIX: This will now work correctly
      console.log("Fetched liked listings:", likesResponse.data);
      const likedIds = new Set(likesResponse.data.map(listing => listing.listingId));
      setLikedListingIds(likedIds);

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      let errorMsg = "Could not load dashboard data. Please try again.";
      if (err.message === "No authentication token found." || err.response?.status === 403 || err.response?.status === 401) {
          errorMsg = "Please log in to view the dashboard.";
          setTimeout(() => navigate('/login'), 1500);
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  const handleRetry = () => {
    fetchDashboardData();
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setListings(allListings);
    } else {
      const filtered = allListings.filter(listing => 
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        (listing.category && listing.category.name.toLowerCase().includes(query))
      );
      setListings(filtered);
    }
  };

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

  // This function now just finds the ID and calls the new handler
  const openModal = (listing) => {
    handleOpenListing(listing.listingId);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedListing(null);
  };

  // --- UPDATED: Like Toggle Handler ---
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
  // --------------------------------

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
      <div className="dashboard-page">
        <Header 
          userName="" 
          searchQuery="" 
          onSearchChange={() => {}} 
          onLogout={handleLogout} 
        />
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      
      <Header 
        userName={userName}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onLogout={handleLogout}
        onNotificationClick={handleNotificationClick}
      />

      <main className="dashboard-body">
        {error && <ErrorBoundary error={error} onRetry={handleRetry} />}

        <section className="content-card hero-card">
          <div className="hero-left">
            <h1 className="hero-title">Your Campus Marketplace for Students</h1>
            <p className="hero-subtitle">
              Edu-Rent makes it easy to rent, buy, and sell items within your university community. Find textbooks, electronics, and more.
            </p>
            <Link to="/browse" className="hero-button">Browse All Items</Link>
          </div>
          <div className="hero-right">
            <div className="hero-image-placeholder">📚 Marketplace Hub</div>
          </div>
        </section>

        <section>
          <h2 className="section-title">Explore by Category</h2>
           {categories.length > 0 ? (
             <div className="category-grid">
               {categories.slice(0, 5).map(category => (
                 <CategoryCardComponent key={category.categoryId} category={category} />
               ))}
             </div>
           ) : (
             <p style={{color: 'var(--text-muted)'}}>No categories found.</p>
           )}
        </section>

        <section>
          <h2 className="section-title">🌟 Featured Items</h2>
          {listings.length > 0 ? (
            <div className="listing-grid">
              {listings.slice(0, 3).map(listing => (
                <ListingCard 
                  key={listing.listingId} 
                  listing={listing} 
                  onClick={openModal}
                  // <--- FIX: Added missing props
                  isLiked={likedListingIds.has(listing.listingId)}
                  onLikeClick={handleLikeToggle}
                  currentUserId={userData?.userId}
                  isLiking={likingInProgress.has(listing.listingId)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">✨</div>
              <div className="empty-state-title">No Featured Items</div>
              <p>Check back soon for featured listings!</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="section-title">📦 All Listings</h2>
          {listings.length > 0 ? (
            <div className="listing-grid">
              {listings.map(listing => (
                <ListingCard 
                  key={listing.listingId} 
                  listing={listing} 
                  onClick={openModal}
                  // <--- FIX: Added missing props
                  isLiked={likedListingIds.has(listing.listingId)}
                  onLikeClick={handleLikeToggle}
                  currentUserId={userData?.userId}
                  isLiking={likingInProgress.has(listing.listingId)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No Listings Found</div>
              <p>{searchQuery ? 'Try adjusting your search terms' : 'No listings available at the moment'}</p>
            </div>
          )}
        </section>

        <section className="content-card cta-card">
          <h2 className="cta-title">Have items to sell or rent?</h2>
          <p className="cta-subtitle">
            Turn your unused items into cash by listing them on Edu-Rent.
          </p>
          <Link to="/list-item" className="cta-button">Start Selling Today</Link>
        </section>
      </main>

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
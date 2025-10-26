import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, getListings, getCategories } from '../services/apiService';
import ProductDetailModal from '../components/ProductDetailModal';
import ListingCard from '../components/ListingCard';

// Import the page's content CSS
import '../static/DashboardPage.css';

// --- IMPORT THE HEADER COMPONENT ---
import Header from '../components/Header'; 

// --- MOCK CATEGORIES REMOVED ---

// --- Loading Skeleton Component ---
function LoadingSkeleton() {
  return (
    <div className="dashboard-body">
      <div className="content-card skeleton skeleton-hero"></div>
      <div>
        <div className="skeleton skeleton-text large" style={{ width: '200px' }}></div>
        <div className="category-grid">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton skeleton-text" style={{ height: '80px' }}></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Error Boundary Component ---
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

// --- Category Card Component (UPDATED) ---
function CategoryCardComponent({ category }) {
  return (
    // Use categoryId from backend
    <Link to={`/category/${category.categoryId}`} style={{ textDecoration: 'none' }}> 
      <div className="category-card">
        <div style={{ textAlign: 'center' }}>
          {/* Add fallback icon */}
          <div>{category.name}</div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState([]); // Filtered list for display
  const [allListings, setAllListings] = useState([]); // Original fetched list
  const [categories, setCategories] = useState([]); // --- ADDED categories state
  const navigate = useNavigate();

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  // --- Reusable Data Fetching Function (UPDATED) ---
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch user, listings, and categories in parallel
      const userPromise = getCurrentUser();
      const listingsPromise = getListings();
      const categoriesPromise = getCategories(); // <-- ADDED

      const [userResponse, listingsResponse, categoriesResponse] = await Promise.all([
        userPromise,
        listingsPromise,
        categoriesPromise, // <-- ADDED
      ]);

      // Process user
      if (userResponse.data && userResponse.data.fullName) {
        setUserName(userResponse.data.fullName.split(' ')[0]);
      } else {
        setUserName('User'); // Fallback
      }

      // Process listings
      console.log("Fetched listings:", listingsResponse.data); // Log to check data
      setAllListings(listingsResponse.data || []); // Store original list
      setListings(listingsResponse.data || []); // Set initial display list

      // Process categories
      console.log("Fetched categories:", categoriesResponse.data);
      setCategories(categoriesResponse.data || []); // <-- ADDED

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

  // --- Fetch Data on Component Mount ---
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Run once when component mounts

  // --- Event Handlers ---
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
        (listing.category && listing.category.name.toLowerCase().includes(query)) // Add category search
      );
      setListings(filtered);
    }
  };

  // --- Modal Handlers ---
  const openModal = (listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedListing(null);
  };

  // --- Render Loading Skeleton ---
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

  // --- Render Page ---
  return (
    <div className="dashboard-page">
      
      <Header 
        userName={userName}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onLogout={handleLogout}
      />

      <main className="dashboard-body">
        {error && <ErrorBoundary error={error} onRetry={handleRetry} />}

        {/* Hero Card */}
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

        {/* Explore by Category (UPDATED) */}
        <section>
          <h2 className="section-title">Explore by Category</h2>
           {/* --- Use fetched categories --- */}
           {categories.length > 0 ? (
              <div className="category-grid">
                {/* Display first 5 categories */}
                {categories.slice(0, 5).map(category => (
                  // Use categoryId for the key
                  <CategoryCardComponent key={category.categoryId} category={category} />
                ))}
              </div>
            ) : (
              <p style={{color: 'var(--text-muted)'}}>No categories found.</p>
            )}
           {/* ----------------------------- */}
        </section>

        {/* Featured Items */}
        <section>
          <h2 className="section-title">🌟 Featured Items</h2>
          {listings.length > 0 ? (
            <div className="listing-grid">
              {listings.slice(0, 3).map(listing => (
                <ListingCard key={listing.listingId} listing={listing} onClick={openModal} />
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

        {/* All Listings */}
        <section>
          <h2 className="section-title">📦 All Listings</h2>
          {listings.length > 0 ? (
            <div className="listing-grid">
              {listings.map(listing => (
                <ListingCard key={listing.listingId} listing={listing} onClick={openModal} />
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

        {/* Call to Action Card */}
        <section className="content-card cta-card">
          <h2 className="cta-title">Have items to sell or rent?</h2>
          <p className="cta-subtitle">
            Turn your unused items into cash by listing them on Edu-Rent.
          </p>
          <Link to="/list-item" className="cta-button">Start Selling Today</Link>
        </section>
      </main>

      {isModalOpen && selectedListing && (
          <ProductDetailModal listing={selectedListing} onClose={closeModal} />
      )}
      
    </div>
  );
}
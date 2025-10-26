import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header'; // Reuse Header
import ListingCard from '../components/ListingCard'; // Reuse ListingCard
// Import all three functions
import { getCurrentUser, getListings, getCategories } from '../services/apiService'; 
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import ProductDetailModal from '../components/ProductDetailModal';

// Import CSS
import '../static/BrowsePage.css';
// Import shared styles needed (e.g., listing grid, CTA card)
import '../static/DashboardPage.css'; // Assuming listing grid and CTA styles are here

const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  ),
};

export default function BrowsePage() {
  const [userName, setUserName] = useState('');
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [allListings, setAllListings] = useState([]); // Store original listings
  const [filteredListings, setFilteredListings] = useState([]); // Listings to display
  const [categories, setCategories] = useState([]); // <-- ADDED state for categories
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Fetch User, Listings, and Categories Data ---
  useEffect(() => {
    const fetchData = async () => {
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
          categoriesPromise // <-- ADDED
        ]);

        // Process User
        if (userResponse.data && userResponse.data.fullName) {
          setUserName(userResponse.data.fullName.split(' ')[0]);
        } else {
           setUserName('User'); // Fallback
        }

        // Process Listings
        console.log("Fetched listings:", listingsResponse.data);
        setAllListings(listingsResponse.data || []);
        setFilteredListings(listingsResponse.data || []);

        // Process Categories
        console.log("Fetched categories:", categoriesResponse.data);
        setCategories(categoriesResponse.data || []); // <-- ADDED

      } catch (err) {
        console.error("Failed to fetch data:", err);
        let errorMsg = "Could not load data. Please try again.";
        // Check for auth errors to redirect
        if (err.message === "No authentication token found." || err.response?.status === 403 || err.response?.status === 401) {
          errorMsg = "Please log in to view this page.";
          setTimeout(() => navigate('/login'), 1500);
        }
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // --- Search Handler ---
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = allListings.filter(listing => {
      const titleMatch = listing.title.toLowerCase().includes(query);
      const descriptionMatch = listing.description.toLowerCase().includes(query);
      // Check that category and category.name exist before filtering
      const categoryMatch = listing.category && listing.category.name && 
                            listing.category.name.toLowerCase().includes(query);
      return titleMatch || descriptionMatch || categoryMatch;
    });
    setFilteredListings(filtered);
  };

   // --- Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  // --- Modal handlers ---
  const openModal = (listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedListing(null);
  };

  // Filter listings for display using backend DTO field 'listingType'
  const saleListings = filteredListings.filter(l => l.listingType.toUpperCase().includes('SALE'));
  const rentListings = filteredListings.filter(l => l.listingType.toUpperCase().includes('RENT'));

  // --- Render Loading/Error ---
  if (isLoading) {
    return (
        <div className="profile-page"> {/* Reusing class for header consistency */}
            <Header userName="" onLogout={handleLogout} searchQuery="" onSearchChange={()=>{}} />
            <main className="browse-page-container">
                <div className="browse-search-bar skeleton" style={{ height: '60px', marginBottom: '2rem' }}></div>
                <section className="browse-section">
                    <div className="skeleton skeleton-listing-text" style={{ height: '2.5rem', width: '200px', marginBottom: '1.5rem' }}></div>
                    <ListingGridSkeleton count={4} /> {/* Show 4 skeleton cards */}
                </section>
                 <section className="browse-section">
                    <div className="skeleton skeleton-listing-text" style={{ height: '2.5rem', width: '200px', marginBottom: '1.5rem' }}></div>
                    <ListingGridSkeleton count={4} /> {/* Show 4 skeleton cards */}
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

  // --- Render Browse Page ---
  return (
    <div className="profile-page"> {/* Reuse class for consistent header */}
      <Header
        userName={userName}
        onLogout={handleLogout}
        searchQuery={searchQuery} // Pass search query to header
        onSearchChange={handleSearchChange} // Let header use the main search handler
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
                // Use listingId from backend as key
                <ListingCard key={listing.listingId} listing={listing} onClick={openModal} />
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
                // Use listingId from backend as key
                <ListingCard key={listing.listingId} listing={listing} onClick={openModal} />
              ))}
            </div>
          ) : (
             <p style={{ color: 'var(--text-muted)' }}>No items found for rent {searchQuery ? 'matching your search' : ''}.</p>
          )}
        </section>

        {/* Call to Action Card (Reused from Dashboard) */}
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
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header'; // Reuse Header
import ListingCard from '../components/ListingCard'; // Reuse ListingCard
import { getCurrentUser, getListings, getCategories } from '../services/apiService'; 
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import ProductDetailModal from '../components/ProductDetailModal';

// Import CSS (Reuse styles)
import '../static/BrowsePage.css';
import '../static/DashboardPage.css';

const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  ),
};

export default function ForSalePage() {
  const [userName, setUserName] = useState('');
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [allSaleListings, setAllSaleListings] = useState([]); // Store original sale listings
  const [filteredSaleListings, setFilteredSaleListings] = useState([]); // Sale listings to display
  // const [categories, setCategories] = useState([]); // <-- Added state (optional if not used)
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Fetch User and Listings Data ---
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

        // Process Categories (optional, just to match pattern)
        // setCategories(categoriesResponse.data || []);

        // Process Listings: Fetch ALL, then filter for 'SALE'
        const allItems = listingsResponse.data || [];
        
        // --- THIS IS THE FIX ---
        const saleItems = allItems.filter(item => 
          item.listingType.toUpperCase().includes('SALE')
        );
        // -----------------------
        
        console.log("Fetched and filtered sale items:", saleItems);
        setAllSaleListings(saleItems); // Set the master list of sale items
        setFilteredSaleListings(saleItems); // Set the initial displayed list

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

  // --- Search Handler (Filters only sale listings) ---
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = allSaleListings.filter(listing => { // Filter from allSaleListings
      const titleMatch = listing.title.toLowerCase().includes(query);
      const descriptionMatch = listing.description.toLowerCase().includes(query);
      const categoryMatch = listing.category && listing.category.name &&
                            listing.category.name.toLowerCase().includes(query);
      return titleMatch || descriptionMatch || categoryMatch;
    });
    setFilteredSaleListings(filtered); // Update the displayed list
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

  // --- Render Loading/Error ---
  if (isLoading) {
      return (
          <div className="profile-page">
              <Header userName="" onLogout={handleLogout} searchQuery="" onSearchChange={()=>{}} />
              <main className="browse-page-container">
                  <div className="browse-search-bar skeleton" style={{ height: '60px', marginBottom: '2rem' }}></div>
                  <section className="browse-section">
                      <div className="skeleton skeleton-listing-text" style={{ height: '2rem', width: '200px', marginBottom: '1.5rem' }}></div>
                      <ListingGridSkeleton count={8} /> {/* Show more skeletons */}
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

  // --- Render For Sale Page ---
  return (
    <div className="profile-page">
      <Header
        userName={userName}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <main className="browse-page-container">
        {/* Search Bar */}
        <div className="browse-search-bar">
           <span className="browse-search-icon"><Icons.Search /></span>
           <input
             type="text"
             className="browse-search-input"
             placeholder="Search for items to buy..." // Updated placeholder
             value={searchQuery}
             onChange={handleSearchChange}
             aria-label="Search items for sale"
           />
        </div>

        {/* For Sale Section */}
        <section className="browse-section">
          <h2 className="browse-section-title">Items For Sale</h2> {/* Updated Title */}
          {filteredSaleListings.length > 0 ? (
            <div className="listing-grid">
              {filteredSaleListings.map(listing => (
                // Use listingId from backend as key
                <ListingCard key={listing.listingId} listing={listing} onClick={openModal} />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              No items found for sale {searchQuery ? 'matching your search' : ''}.
            </p>
          )}
        </section>

        {/* Call to Action Card (Reused) */}
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
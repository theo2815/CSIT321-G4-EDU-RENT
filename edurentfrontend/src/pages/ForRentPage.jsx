import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header'; // Reuse Header
import ListingCard from '../components/ListingCard'; // Reuse ListingCard
import { getCurrentUser, getProducts } from '../services/apiService'; // Use getProducts (listings)
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import ProductDetailModal from '../components/ProductDetailModal';


// Import CSS (We can reuse styles from Browse and Dashboard)
import '../static/BrowsePage.css'; // For layout and search bar
import '../static/DashboardPage.css'; // For listing grid and CTA card

const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  ),
};

// --- Mock Data (Replace with API fetch later) ---
// Using the same mock data as BrowsePage for demonstration
const MOCK_LISTINGS = [
 { id: 1, title: 'Intro to CS Textbook', description: 'Excellent condition', price: 45, type: 'sale', category: 'Textbooks', image: null, icon: '📚' },
 { id: 2, title: 'Bluetooth Headphones', description: 'Barely used', price: 25, type: 'rent', category: 'Electronics', image: null, icon: '🎧' },
 { id: 3, title: 'Desk Lamp LED', description: 'Perfect for studying', price: 15, type: 'rent', category: 'Furniture', image: null, icon: '💡' },
 { id: 4, title: 'Organic Chem Lab Manual', description: 'Complete notes', price: 35, type: 'sale', category: 'Textbooks', image: null, icon: '📖' },
 { id: 5, title: 'USB-C Hub Adapter', description: 'Multi-port, like new', price: 20, type: 'sale', category: 'Electronics', image: null, icon: '🔌' },
 { id: 6, title: 'Microscope', description: 'Lab equipment for rent', price: 50, type: 'rent', category: 'Lab Equipment', image: null, icon: '🔬' },
 { id: 7, title: 'Mini Fridge', description: 'Good for dorm room', price: 40, type: 'sale', category: 'Furniture', image: null, icon: '🧊' },
];


export default function ForRentPage() {
  const [userName, setUserName] = useState('');
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [allRentListings, setAllRentListings] = useState([]); // Store original rent listings
  const [filteredRentListings, setFilteredRentListings] = useState([]); // Rent listings to display
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
        // Fetch user data (for header)
        const userResponse = await getCurrentUser();
        if (userResponse.data && userResponse.data.fullName) {
          setUserName(userResponse.data.fullName.split(' ')[0]);
        }

        // TODO: Fetch actual listings from API and filter for rent
        // const listingsResponse = await getProducts();
        // const rentItems = listingsResponse.data.filter(item => item.type === 'rent');
        // setAllRentListings(rentItems);
        // setFilteredRentListings(rentItems);

        // Using Mock Data for now - Filter immediately
        const rentItems = MOCK_LISTINGS.filter(item => item.type === 'rent');
        setAllRentListings(rentItems);
        setFilteredRentListings(rentItems);

      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Could not load data. Please try again.");
        // Redirect to login if not authenticated
        if (err.message === "No authentication token found.") {
           navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // --- Search Handler (Filters only rent listings) ---
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = allRentListings.filter(listing => // Filter from allRentListings
      listing.title.toLowerCase().includes(query) ||
      listing.description.toLowerCase().includes(query) ||
      listing.category.toLowerCase().includes(query)
    );
    setFilteredRentListings(filtered);
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
              {/* --- Render Skeleton --- */}
              <main className="browse-page-container">
                  {/* Skeleton Search Bar (Optional, can just show empty space) */}
                  <div className="browse-search-bar skeleton" style={{ height: '60px', marginBottom: '2rem' }}></div>
                  {/* Skeleton for Sections */}
                  <section className="browse-section">
                      <div className="skeleton skeleton-listing-text" style={{ height: '2rem', width: '200px', marginBottom: '1.5rem' }}></div>
                      <ListingGridSkeleton count={4} /> {/* Show 4 skeleton cards */}
                  </section>
                   <section className="browse-section">
                      <div className="skeleton skeleton-listing-text" style={{ height: '2rem', width: '200px', marginBottom: '1.5rem' }}></div>
                      <ListingGridSkeleton count={4} /> {/* Show 4 skeleton cards */}
                  </section>
              </main>
              {/* -------------------- */}
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

  // --- Render For Rent Page ---
  return (
    <div className="profile-page"> {/* Reuse class for consistent header */}
      <Header
        userName={userName}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <main className="browse-page-container"> {/* Reuse container class */}
        {/* Search Bar */}
        <div className="browse-search-bar">
           <span className="browse-search-icon"><Icons.Search /></span>
           <input
             type="text"
             className="browse-search-input"
             placeholder="Search for items to rent..." // Updated placeholder
             value={searchQuery}
             onChange={handleSearchChange}
             aria-label="Search items for rent"
           />
        </div>

        {/* For Rent Section */}
        <section className="browse-section">
          <h2 className="browse-section-title">Items For Rent</h2>
          {filteredRentListings.length > 0 ? (
            <div className="listing-grid"> {/* Reuse listing grid */}
              {filteredRentListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} onClick={openModal} />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              No items found for rent {searchQuery ? 'matching your search' : ''}.
            </p>
          )}
        </section>

        {/* Call to Action Card (Reused from Dashboard) */}
        <section className="content-card cta-card">
          <h2 className="cta-title">Have items to sell or rent?</h2>
          <p className="cta-subtitle">
            Turn your unused items into cash by listing them on Edu-Rent. It’s easy, secure, and connects you directly with fellow students.
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
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import ProductDetailModal from '../components/ProductDetailModal';
import { getCurrentUser, getProducts, getCategories } from '../services/apiService'; // Assuming getCategories exists

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

// --- Mock Data (Simulate fetching category info and listings) ---
// Use existing mock listings
const MOCK_LISTINGS = [
 { id: 1, title: 'Intro to CS Textbook', description: 'Excellent condition', price: 45, type: 'sale', categoryId: 1, category: 'Textbooks', image: null, icon: '📚' },
 { id: 2, title: 'Bluetooth Headphones', description: 'Barely used', price: 25, type: 'rent', categoryId: 2, category: 'Electronics', image: null, icon: '🎧' },
 { id: 3, title: 'Desk Lamp LED', description: 'Perfect for studying', price: 15, type: 'rent', categoryId: 3, category: 'Furniture', image: null, icon: '💡' },
 { id: 4, title: 'Organic Chem Lab Manual', description: 'Complete notes', price: 35, type: 'sale', categoryId: 1, category: 'Textbooks', image: null, icon: '📖' },
 { id: 5, title: 'USB-C Hub Adapter', description: 'Multi-port, like new', price: 20, type: 'sale', categoryId: 2, category: 'Electronics', image: null, icon: '🔌' },
 { id: 6, title: 'Microscope', description: 'Lab equipment for rent', price: 50, type: 'rent', categoryId: 4, category: 'Lab Equipment', image: null, icon: '🔬' },
 { id: 7, title: 'Mini Fridge', description: 'Good for dorm room', price: 40, type: 'sale', categoryId: 3, category: 'Furniture', image: null, icon: '🧊' },
];
// Use existing mock categories, adding IDs if missing
const MOCK_CATEGORIES = [
  { id: 1, name: 'Textbooks', icon: '📚' },
  { id: 2, name: 'Electronics', icon: '💻' },
  { id: 3, name: 'Furniture', icon: '🪑' },
  { id: 4, name: 'Lab Equipment', icon: '🔬' },
  { id: 5, name: 'Apparel', icon: '👕' },
  { id: 6, name: 'Other', icon: '📦' },
];

export default function CategoryPage() {
  const { categoryId } = useParams(); // Get category ID from URL
  const [userName, setUserName] = useState('');
  const [categoryInfo, setCategoryInfo] = useState(null); // Info about the current category
  const [categoryListings, setCategoryListings] = useState([]); // Original listings for this category
  const [filteredListings, setFilteredListings] = useState([]); // Filtered list to display
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Fetch User, Category Info, and Listings ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const catIdNumber = parseInt(categoryId, 10); // Convert URL param to number

      if (isNaN(catIdNumber)) {
          setError("Invalid category specified.");
          setIsLoading(false);
          return;
      }

      try {
        // Fetch user (can often be parallel)
        const userPromise = getCurrentUser();

        // TODO: Fetch category details by ID from API
        // const categoryPromise = getCategoryById(catIdNumber);
        const categoryPromise = Promise.resolve(MOCK_CATEGORIES.find(cat => cat.id === catIdNumber)); // Mock find

        // TODO: Fetch listings filtered by categoryId from API
        // const listingsPromise = getListingsByCategory(catIdNumber);
        const listingsPromise = Promise.resolve(MOCK_LISTINGS.filter(item => item.categoryId === catIdNumber)); // Mock filter

        // Wait for all promises
        const [userResponse, categoryData, listingsData] = await Promise.all([userPromise, categoryPromise, listingsPromise]);

        // Process user
        if (userResponse.data && userResponse.data.fullName) {
          setUserName(userResponse.data.fullName.split(' ')[0]);
        } else {
            setUserName('User'); // Fallback
        }

        // Process category
        if (!categoryData) {
            throw new Error(`Category with ID ${catIdNumber} not found.`);
        }
        setCategoryInfo(categoryData);

        // Process listings
        setCategoryListings(listingsData);
        setFilteredListings(listingsData);

      } catch (err) {
        console.error("Failed to fetch category data:", err);
        setError(err.message || "Could not load category data. Please try again.");
        if (err.message === "No authentication token found.") {
           navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [categoryId, navigate]); // Re-run if categoryId changes

  // --- Search Handler ---
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = categoryListings.filter(listing => // Filter from categoryListings
      listing.title.toLowerCase().includes(query) ||
      listing.description.toLowerCase().includes(query)
      // Add more fields to search if needed
    );
    setFilteredListings(filtered);
  };

   // --- Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  // --- Modal State & Handlers --- (Copied from BrowsePage)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const openModal = (listing) => { setSelectedListing(listing); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setSelectedListing(null); };
  // ------------------------------

  // --- Render Loading/Error ---
  if (isLoading) {
    return (
        <div className="profile-page">
            <Header userName="" onLogout={handleLogout} />
            <main className="category-page-container">
                {/* Skeleton for Header and Grid */}
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
                {/* Optional: Add a button to go back */}
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Link to="/dashboard" className="cta-button">Back to Dashboard</Link>
                </div>
            </main>
        </div>
     );
  }

  // --- Render Category Page ---
  return (
    <div className="profile-page"> {/* Reuse for header consistency */}
      <Header
        userName={userName}
        onLogout={handleLogout}
        // Don't pass search query/handler if header search shouldn't affect this page
        searchQuery=""
        onSearchChange={()=>{}} // Or implement global search later
      />

      <main className="category-page-container">
        {/* Page Header */}
        <div className="category-page-header">
            <h1 className="category-page-title">
                {categoryInfo?.icon && <span style={{ marginRight: '0.5rem' }}>{categoryInfo.icon}</span>}
                {categoryInfo?.name || 'Category'}
            </h1>
        </div>

        {/* Search Bar (Specific to this category) */}
        <div className="browse-search-bar" style={{marginBottom: '2rem'}}> {/* Added margin */}
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

        {/* Optional Filters Section */}
        {/* <div className="category-filters">
            <select className="filter-select"><option>Sort by Recent</option><option>Sort by Price</option></select>
            {/* Add more filters here *}
        </div> */}

        {/* Listings Grid */}
        <section>
          {filteredListings.length > 0 ? (
            <div className="listing-grid"> {/* Reuse listing grid */}
              {filteredListings.map(listing => (
                <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={openModal} // Open modal on click
                />
              ))}
            </div>
          ) : (
            <div className="empty-state"> {/* Reuse empty state */}
                <div className="empty-state-icon">{categoryInfo?.icon || '📂'}</div>
                <div className="empty-state-title">No Listings Found</div>
                <p>
                    There are currently no items listed in the "{categoryInfo?.name || 'selected'}" category
                    {searchQuery ? ' matching your search' : ''}.
                </p>
                {/* Optional: Link back or to create listing */}
                 <Link to="/dashboard" className="cta-button" style={{marginTop: '1rem'}}>Back to Dashboard</Link>
            </div>
          )}
        </section>

      </main>

       {/* --- Render Modal Conditionally --- */}
       {isModalOpen && selectedListing && (
          <ProductDetailModal listing={selectedListing} onClose={closeModal} />
       )}
       {/* ---------------------------------- */}
    </div>
  );
}
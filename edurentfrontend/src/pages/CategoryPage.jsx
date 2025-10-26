import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import ListingGridSkeleton from '../components/ListingGridSkeleton';
import ProductDetailModal from '../components/ProductDetailModal';
// --- Updated Imports (using getCategories) ---
import { 
  getCurrentUser, 
  getCategories, // <-- Changed from getCategoryById
  getListingsByCategoryId 
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

// --- MOCK DATA REMOVED ---

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

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  // --- Fetch User, Category Info, and Listings (using 'modified' logic) ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const catIdNumber = parseInt(categoryId, 10);

      if (isNaN(catIdNumber)) {
          setError("Invalid category specified.");
          setIsLoading(false);
          return;
      }

      try {
        const userPromise = getCurrentUser();
        // Fetch ALL categories to find the name
        const categoriesPromise = getCategories(); // <-- Use getCategories()
        // Fetch listings specific to THIS category
        const listingsPromise = getListingsByCategoryId(catIdNumber);

        const [userResponse, categoriesResponse, listingsResponse] = await Promise.all([
          userPromise,
          categoriesPromise,
          listingsPromise,
        ]);

        // Process user
        if (userResponse.data && userResponse.data.fullName) {
          setUserName(userResponse.data.fullName.split(' ')[0]);
        } else {
            setUserName('User');
        }

        // Process category info (find name from all categories)
        const allCategories = categoriesResponse.data || [];
        const currentCategory = allCategories.find(cat => cat.categoryId === catIdNumber); // <-- Use .find()
        if (!currentCategory) {
            throw new Error(`Category with ID ${catIdNumber} not found.`);
        }
        setCategoryInfo(currentCategory); // Contains { categoryId, name, ... }

        // Process listings
        setCategoryListings(listingsResponse.data || []);
        setFilteredListings(listingsResponse.data || []);

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
    };
    fetchData();
  }, [categoryId, navigate]); // Re-run if categoryId changes

  // --- Search Handler (Filters the categoryListings state) ---
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = categoryListings.filter(listing => // Filter from categoryListings
      listing.title.toLowerCase().includes(query) ||
      listing.description.toLowerCase().includes(query)
    );
    setFilteredListings(filtered);
  };

   // --- Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  // --- Modal State & Handlers ---
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
        searchQuery=""
        onSearchChange={()=>{}} // Header search is disabled on this page
      />

      <main className="category-page-container">
        {/* Page Header */}
        <div className="category-page-header">
            <h1 className="category-page-title">
                {/* Use backend data, fallback to '📦' */}
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

        {/* Listings Grid */}
        <section>
          {filteredListings.length > 0 ? (
            <div className="listing-grid"> {/* Reuse listing grid */}
              {filteredListings.map(listing => (
                <ListingCard
                    // --- Updated Key ---
                    key={listing.listingId} 
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
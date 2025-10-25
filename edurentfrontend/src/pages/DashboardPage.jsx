import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/apiService';
import ProductDetailModal from '../components/ProductDetailModal';
import ListingCard from '../components/ListingCard';

// Import the page's content CSS
import '../static/DashboardPage.css';

// --- IMPORT THE NEW HEADER COMPONENT ---
import Header from '../components/Header'; 

// --- Category Data with Icons ---
const CATEGORIES = [
  { id: 1, name: 'Textbooks', icon: '📚' },
  { id: 2, name: 'Electronics', icon: '💻' },
  { id: 3, name: 'Furniture', icon: '🪑' },
  { id: 4, name: 'Lab Equipment', icon: '🔬' },
  { id: 5, name: 'Other', icon: '📦' },
];

// --- Mock Listing Data ---
const MOCK_LISTINGS = [
  { id: 1, title: 'Introduction to Computer Science', description: 'Textbook in excellent condition', price: 45, type: 'sale', category: 'Textbooks', image: null, icon: '📚' },
  { id: 2, title: 'Wireless Bluetooth Headphones', description: 'Barely used, great sound quality', price: 25, type: 'rent', category: 'Electronics', image: null, icon: '🎧' },
  { id: 3, title: 'Desk Lamp LED', description: 'Perfect for studying', price: 15, type: 'rent', category: 'Furniture', image: null, icon: '💡' },
  { id: 4, title: 'Organic Chemistry Lab Manual', description: 'Complete with notes', price: 35, type: 'sale', category: 'Textbooks', image: null, icon: '📖' },
  { id: 5, title: 'USB-C Hub Adapter', description: 'Multi-port, like new', price: 20, type: 'sale', category: 'Electronics', image: null, icon: '🔌' },
  { id: 6, title: 'Microscope', description: 'Lab equipment for rent', price: 50, type: 'rent', category: 'Lab Equipment', image: null, icon: '🔬' },
];

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

// Note: using shared ListingCard component from ../components/ListingCard

// --- Category Card Component ---
function CategoryCardComponent({ category }) {
  return (
    <Link to={`/category/${category.id}`} style={{ textDecoration: 'none' }}>
      <div className="category-card">
        <div style={{ textAlign: 'center' }}>
          <span className="category-icon">{category.icon}</span>
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
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const navigate = useNavigate();

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  // --- Fetch User Data ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getCurrentUser();
        const userData = response.data; 

        if (userData && userData.fullName) {
            const firstName = userData.fullName.split(' ')[0];
            setUserName(firstName);
        } else {
            console.error("User data fetched but incomplete:", userData);
            throw new Error("Incomplete user data received.");
        }
      } catch (error) {
        console.error("Failed to fetch user:", error.message);
        setError("Failed to load user data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser(); 
  }, []); 

  // --- Event Handlers (Stay in the parent) ---
  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  const handleRetry = () => {
    // ... (retry logic remains the same) ...
    setError(null);
    setIsLoading(true);
    const fetchUser = async () => {
      try {
        const response = await getCurrentUser();
        const userData = response.data; 
        if (userData && userData.fullName) {
            const firstName = userData.fullName.split(' ')[0];
            setUserName(firstName);
        } else {
            throw new Error("Incomplete user data received.");
        }
      } catch (error) {
        console.error("Failed to fetch user:", error.message);
        setError("Failed to load user data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setListings(MOCK_LISTINGS);
    } else {
      const filtered = MOCK_LISTINGS.filter(listing =>
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        listing.category.toLowerCase().includes(query)
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
        {/* Pass minimal info to Header during load */}
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
      
      {/* --- RENDER THE HEADER COMPONENT --- */}
      <Header 
        userName={userName}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onLogout={handleLogout}
      />

      {/* --- Body Section --- */}
      <main className="dashboard-body">
        {/* Error Boundary */}
        {error && <ErrorBoundary error={error} onRetry={handleRetry} />}

        {/* Hero Card */}
        <section className="content-card hero-card">
          <div className="hero-left">
            <h1 className="hero-title">Your Campus Marketplace for Students</h1>
            <p className="hero-subtitle">
              Edu-Rent makes it easy to rent, buy, and sell items within your university community. Find textbooks, electronics, and more — all at student-friendly prices.
            </p>
            <Link to="/browse" className="hero-button">Browse All Items</Link>
          </div>
          <div className="hero-right">
            <div className="hero-image-placeholder">📚 Marketplace Hub</div>
          </div>
        </section>

        {/* Explore by Category */}
        <section>
          <h2 className="section-title">Explore by Category</h2>
          <div className="category-grid">
            {CATEGORIES.map(category => (
              <CategoryCardComponent key={category.id} category={category} />
            ))}
          </div>
        </section>

        {/* Featured Items */}
        <section>
          <h2 className="section-title">🌟 Featured Items</h2>
          {listings.length > 0 ? (
            <div className="listing-grid">
              {listings.slice(0, 3).map(listing => (
                <ListingCard key={listing.id} listing={listing} onClick={openModal} />
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
                <ListingCard key={listing.id} listing={listing} onClick={openModal} />
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
            Turn your unused items into cash by listing them on Edu-Rent. It's easy, secure, and connects you directly with fellow students.
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
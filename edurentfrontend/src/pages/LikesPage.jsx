import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header'; // Reuse Header
import ListingCard from '../components/ListingCard'; // Reuse ListingCard
import ListingGridSkeleton from '../components/ListingGridSkeleton'; // Reuse Skeleton
import ProductDetailModal from '../components/ProductDetailModal';
import { getCurrentUser } from '../services/apiService'; // To get user info
// TODO: Import function to get liked items, e.g., getLikedListings

// Import CSS
import '../static/LikesPage.css';
// Import shared styles needed (e.g., listing grid, empty state)
import '../static/DashboardPage.css'; // Assuming listing grid and empty state styles are here

// --- Mock Data (Replace with API fetch later) ---
// Simulate fetching listings based on IDs the user might have liked
const MOCK_ALL_LISTINGS = [
 { id: 1, title: 'Intro to CS Textbook', description: 'Excellent condition', price: 45, type: 'sale', category: 'Textbooks', image: null, icon: '📚' },
 { id: 2, title: 'Bluetooth Headphones', description: 'Barely used', price: 25, type: 'rent', category: 'Electronics', image: null, icon: '🎧' },
 { id: 3, title: 'Desk Lamp LED', description: 'Perfect for studying', price: 15, type: 'rent', category: 'Furniture', image: null, icon: '💡' },
 // Add more mock listings if needed
];
// Simulate user's liked item IDs
const MOCK_LIKED_IDS = [2, 3];
const MOCK_LIKED_LISTINGS = MOCK_ALL_LISTINGS.filter(item => MOCK_LIKED_IDS.includes(item.id));


export default function LikesPage() {
  const [userName, setUserName] = useState('');
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [likedListings, setLikedListings] = useState([]); // Store liked items
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Fetch User and Liked Listings Data ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch user data (for header)
        const userResponse = await getCurrentUser();
        if (userResponse.data && userResponse.data.fullName) {
          setUserName(userResponse.data.fullName.split(' ')[0]);
        } else {
            // Handle case where user data is incomplete but token might be valid
            console.warn("User data incomplete, showing default name.");
            setUserName('User'); // Fallback name
        }

        // TODO: Fetch actual liked listings from API for the current user
        // const likedResponse = await getLikedListings(); // Needs implementation
        // setLikedListings(likedResponse.data);

        // Using Mock Data for now
        // Simulate a small delay for loading state
        await new Promise(resolve => setTimeout(resolve, 500));
        setLikedListings(MOCK_LIKED_LISTINGS);

      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Could not load your liked items. Please try again.");
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

  // --- Render Loading/Error/Content ---
  const renderContent = () => {
    if (isLoading) {
      return <ListingGridSkeleton count={4} />; // Show skeleton while loading
    }
    if (error) {
      return <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>;
    }
    if (likedListings.length === 0) {
      return (
        <div className="empty-state"> {/* Reuse empty state style */}
          <div className="empty-state-icon">❤️</div>
          <div className="empty-state-title">No Liked Items Yet</div>
          <p>Browse items and click the heart icon to save them here!</p>
        </div>
      );
    }
    return (
      <div className="listing-grid"> {/* Reuse listing grid */}
        {likedListings.map(listing => (
          <ListingCard key={listing.id} listing={listing} onClick={openModal} />
        ))}
      </div>
    );
  };

  // --- Render Likes Page ---
  return (
    <div className="profile-page"> {/* Reuse class for consistent header */}
      <Header
        userName={userName}
        onLogout={handleLogout}
        // Pass empty search handlers if header includes search but it's not used here
        searchQuery=""
        onSearchChange={() => {}}
      />

      <main className="likes-page-container">
        <h1 className="likes-page-title">❤️ Likes</h1>

        {renderContent()}

      </main>
      {isModalOpen && selectedListing && (
        <ProductDetailModal listing={selectedListing} onClose={closeModal} />
      )}
    </div>
  );
}
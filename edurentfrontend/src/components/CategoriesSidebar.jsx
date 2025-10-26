import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/apiService';

// Import the sidebar CSS
import '../static/CategoriesSidebar.css';

// --- How many categories to show at a time ---
const PAGE_SIZE = 5;

// --- Skeleton Component ---
function CategoryListSkeleton() {
  // Show fewer skeletons to match the initial page size
  return (
    <ul className="category-list" aria-hidden="true">
      {[...Array(PAGE_SIZE)].map((_, index) => (
        <li key={index} className="category-list-item">
          <div 
            className="skeleton skeleton-text" 
            style={{ width: `${60 + (index % 4) * 10}%` }}
          ></div>
        </li>
      ))}
    </ul>
  );
}


export default function CategoriesSidebar({ isVisible, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]); // Holds ALL categories
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // --- NEW State for pagination ---
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // --- Fetch Categories ---
  useEffect(() => {
    if (isVisible && categories.length === 0) {
      setIsLoading(true);
      const fetchCategories = async () => {
        setError(null);
        try {
          const response = await getCategories();
          setCategories(response.data || []); 
        } catch (err) {
          console.error("Failed to fetch categories:", err);
          setError("Could not load categories.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchCategories();
    } else {
      // --- Reset search AND visible count when sidebar closes ---
      setSearchQuery('');
      setVisibleCount(PAGE_SIZE);
    }
  }, [isVisible, categories.length]);; 

  // Filter all categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- NEW: Slice the filtered list to get only the visible ones ---
  const visibleCategories = filteredCategories.slice(0, visibleCount);

  // --- NEW: Handler for the "Load More" button ---
  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + PAGE_SIZE);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`categories-sidebar-overlay ${isVisible ? 'visible' : ''}`}
        onClick={onClose} 
        aria-hidden={!isVisible}
      ></div>

      {/* Sidebar */}
      <aside
        className={`categories-sidebar ${isVisible ? 'visible' : ''}`}
        aria-label="Categories Sidebar"
        aria-hidden={!isVisible}
      >
        {/* Header */}
        <div className="sidebar-header">
          <h2 className="sidebar-title">All Categories</h2>
          <button onClick={onClose} className="sidebar-close-btn" aria-label="Close categories sidebar">
            &times; 
          </button>
        </div>

        {/* Search Bar */}
        <div className="sidebar-search">
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search categories"
          />
        </div>

        {/* Category List */}
        <div className="sidebar-content">
          {isLoading ? (
            <CategoryListSkeleton /> 
          ) : error ? (
            <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>
          ) : visibleCategories.length > 0 ? (
            // Use a Fragment to hold the list and the button
            <>
              <ul className="category-list">
                {/* --- Map over VISIBLE categories --- */}
                {visibleCategories.map(category => (
                  <li key={category.categoryId} className="category-list-item">
                    <Link to={`/category/${category.categoryId}`} onClick={onClose}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
              
              {/* --- NEW: Load More Button --- */}
              {/* Show button only if there are more items to load */}
              {filteredCategories.length > visibleCount && (
                <button onClick={handleLoadMore} className="sidebar-load-more-btn">
                  Load More
                </button>
              )}
            </>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              {searchQuery ? 'No categories found.' : 'No categories available.'}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
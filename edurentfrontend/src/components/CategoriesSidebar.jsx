import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/apiService';

// Custom styles for the sidebar
import '../static/CategoriesSidebar.css';

// Number of categories to display initially
const PAGE_SIZE = 5;

// Loading placeholder component
function CategoryListSkeleton() {
  // Render a specific number of skeleton items to match the page size
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
  const [categories, setCategories] = useState([]); // Stores the full list of categories
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Controls how many items are currently shown for pagination
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Fetch data when the sidebar opens
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
      // Reset search and pagination limit when the sidebar is closed
      setSearchQuery('');
      setVisibleCount(PAGE_SIZE);
    }
  }, [isVisible, categories.length]); 

  // Filter the full list based on the search input
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Limit the displayed list based on the current visible count
  const visibleCategories = filteredCategories.slice(0, visibleCount);

  // Increase the visible count when the user clicks 'Load More'
  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + PAGE_SIZE);
  };

  return (
    <>
      {/* Background overlay */}
      <div
        className={`categories-sidebar-overlay ${isVisible ? 'visible' : ''}`}
        onClick={onClose} 
        aria-hidden={!isVisible}
      ></div>

      {/* Main sidebar container */}
      <aside
        className={`categories-sidebar ${isVisible ? 'visible' : ''}`}
        aria-label="Categories Sidebar"
        aria-hidden={!isVisible}
      >
        {/* Header section with close button */}
        <div className="sidebar-header">
          <h2 className="sidebar-title">All Categories</h2>
          <button onClick={onClose} className="sidebar-close-btn" aria-label="Close categories sidebar">
            &times; 
          </button>
        </div>

        {/* Search input field */}
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

        {/* List of categories */}
        <div className="sidebar-content">
          {isLoading ? (
            <CategoryListSkeleton /> 
          ) : error ? (
            <p style={{ textAlign: 'center', color: 'red' }}>Error: {error}</p>
          ) : visibleCategories.length > 0 ? (
            // Fragment allows us to return the list and the button as siblings
            <>
            <ul className="category-list">
                {visibleCategories.map(category => {
                  // Use guest-prefixed URLs for non-logged-in users
                  const isLoggedIn = !!localStorage.getItem('eduRentUserData');
                  const basePath = isLoggedIn ? '' : '/guest';
                  return (
                    <li key={category.categoryId} className="category-list-item">
                      {/* Use slug if available, otherwise fallback to ID (though ID will redirect to slug if backend populated) */}
                      <Link to={`${basePath}/category/${category.slug || category.categoryId}`} onClick={onClose}>
                        {category.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              
              {/* Only show the 'Load More' button if there are hidden items left */}
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
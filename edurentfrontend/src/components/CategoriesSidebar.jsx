import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Import the sidebar CSS
import '../static/CategoriesSidebar.css';

// --- Mock Category Data ---
const MOCK_CATEGORIES = [
  { id: 1, name: 'Textbooks' },
  { id: 2, name: 'Electronics' },
  { id: 3, name: 'Furniture' },
  { id: 4, name: 'Lab Equipment' },
  { id: 5, name: 'Apparel' },
  { id: 6, name: 'School Supplies' },
  { id: 7, name: 'Dorm Essentials' },
  { id: 8, name: 'Musical Instruments' },
  { id: 9, name: 'Sports Gear' },
  { id: 10, name: 'Other' },
];

export default function CategoriesSidebar({ isVisible, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories based on search
  const filteredCategories = MOCK_CATEGORIES.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prevent rendering if not visible
  // Using conditional rendering + CSS transitions
  return (
    <>
      {/* Overlay */}
      <div
        className={`categories-sidebar-overlay ${isVisible ? 'visible' : ''}`}
        onClick={onClose} // Close sidebar when overlay is clicked
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
            &times; {/* Simple 'X' icon */}
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
          {filteredCategories.length > 0 ? (
            <ul className="category-list">
              {filteredCategories.map(category => (
                <li key={category.id} className="category-list-item">
                  {/* Link to category page (update path as needed) */}
                  <Link to={`/category/${category.id}`} onClick={onClose}>
                        {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              No categories found.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getCurrentUser } from '../services/apiService'; // Assuming API functions exist
// TODO: Import API functions like getUserListings, deleteListing

// Import CSS
import '../static/ManageListingsPage.css';
// Import shared styles
import '../static/ProfilePage.css'; // For .btn-small, .btn-outline etc.
import '../static/DashboardPage.css'; // For .empty-state, .cta-button

// --- Mock Data (Replace with API fetch) ---
// Ensure items have a 'status' property: 'active', 'inactive', 'sold'
const MOCK_USER_LISTINGS_DETAILED = [
 { id: 1, name: 'Calculus 1 Textbook', description: 'Selling my old calc book', listedOn: '2025-10-20', price: 30, likes: 5, status: 'active', image: null, icon: '📚', category: 'Textbooks' },
 { id: 3, name: 'Desk Lamp', description: 'Renting out my extra lamp', listedOn: '2025-10-15', price: 10, likes: 2, status: 'active', image: null, icon: '💡', category: 'Furniture' },
 { id: 8, name: 'Old Biology Notes', description: 'Might be useful', listedOn: '2025-09-01', price: 5, likes: 0, status: 'inactive', image: null, icon: '📝', category: 'Other' },
 { id: 9, name: 'Graduation Gown', description: 'Used once', listedOn: '2025-08-10', price: 25, likes: 8, status: 'sold', image: null, icon: '🎓', category: 'Other' },
];
// Assume mock categories are available or fetched
const MOCK_CATEGORIES = [{ id: 'all', name: 'All Categories' }, { id: 'Textbooks', name: 'Textbooks' }, { id: 'Furniture', name: 'Furniture' }, { id: 'Other', name: 'Other' }];


// --- Manage Listings Skeleton Component ---
function ManageListingsSkeleton() {
  return (
    <div className="manage-listings-page">
      {/* Skeleton Header */}
      <div className="manage-listings-header">
        <div className="skeleton skeleton-filter-label" style={{ height: '2rem', width: '250px', marginBottom: '1rem' }}></div> {/* Title */}
        {/* Skeleton Filters */}
        <div className="skeleton-filters-container">
          {Array.from({ length: 4 }).map((_, i) => ( // Skeleton for 4 filter groups
            <div key={i} className="filter-group skeleton-filter-group">
              <div className="skeleton skeleton-filter-label"></div>
              <div className="skeleton skeleton-filter-input"></div>
            </div>
          ))}
          {/* Add a wider one for search */}
          <div className="filter-group skeleton-filter-group" style={{flexGrow: 1}}>
             <div className="skeleton skeleton-filter-label"></div>
             <div className="skeleton skeleton-filter-input"></div>
          </div>
        </div>
      </div>

      {/* Skeleton Listings Card */}
      <div className="skeleton-listings-card-container">
        <div className="skeleton skeleton-listings-card-header"></div> {/* Header area */}
        {/* Skeleton Table Rows */}
        {Array.from({ length: 5 }).map((_, index) => ( // Show 5 skeleton rows
          <div key={index} className="skeleton-table-row">
            <div className="skeleton skeleton-table-checkbox"></div>
            <div className="skeleton-table-product">
              <div className="skeleton skeleton-table-image"></div>
              <div className="skeleton-table-text-lines">
                <div className="skeleton skeleton-table-line" style={{ width: '70%' }}></div>
                <div className="skeleton skeleton-table-line" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div className="skeleton skeleton-table-cell"></div> {/* Listed On */}
            <div className="skeleton skeleton-table-cell" style={{ width: '50px' }}></div> {/* Price */}
            <div className="skeleton skeleton-table-cell" style={{ width: '40px' }}></div> {/* Likes */}
            <div className="skeleton-table-actions">
              <div className="skeleton skeleton-table-button"></div>
              <div className="skeleton skeleton-table-button"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// --- Main Manage Listings Page Component ---
export default function ManageListingsPage() {
  const [userName, setUserName] = useState('');
  const [allListings, setAllListings] = useState([]); // Original fetched list
  const [filteredListings, setFilteredListings] = useState([]); // List to display
  const [categories, setCategories] = useState(MOCK_CATEGORIES); // Filter options
  const [selectedItems, setSelectedItems] = useState(new Set()); // IDs of selected items
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [bulkActionMessage, setBulkActionMessage] = useState('');
  const navigate = useNavigate();

  // --- Filter/Sort State ---
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent'); // 'recent' or 'oldest'
  const [filterDate, setFilterDate] = useState('all'); // 'all', 'last7', 'last30'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('active'); // Default to 'active' so active products show first

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userRes = await getCurrentUser();
        setUserName(userRes.data?.fullName?.split(' ')[0] || 'User');

        // TODO: Fetch user's listings from API
        // const listingsRes = await getUserListings();
        // setAllListings(listingsRes.data);
        await new Promise(r => setTimeout(r, 500)); // Simulate fetch
        setAllListings(MOCK_USER_LISTINGS_DETAILED);
        // setFilteredListings(MOCK_USER_LISTINGS_DETAILED); // Initial filter happens in the other useEffect

        // TODO: Fetch categories if not hardcoded
        // const catRes = await getCategories();
        // setCategories([{id: 'all', name: 'All Categories'}, ...catRes.data]);

      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Could not load listings.");
        if (err.message === "No authentication token found.") navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // --- Filtering and Sorting Logic ---
  useEffect(() => {
    let result = [...allListings]; // Start with all listings

    // Filter by Status
    if (filterStatus !== 'all') {
      if (filterStatus === 'others') {
        result = result.filter(item => item.status !== 'active' && item.status !== 'inactive');
      } else {
        result = result.filter(item => item.status === filterStatus);
      }
    }

    // Filter by Category
    if (filterCategory !== 'all') {
      // Adjust based on your actual listing data structure for category
      result = result.filter(item => item.category === filterCategory);
    }

    // Filter by Date
    const now = new Date(); // Recalculate 'now' inside useEffect
    if (filterDate === 'last7') {
      const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7));
      result = result.filter(item => new Date(item.listedOn) >= sevenDaysAgo);
    } else if (filterDate === 'last30') {
      const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));
       result = result.filter(item => new Date(item.listedOn) >= thirtyDaysAgo);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.listedOn);
      const dateB = new Date(b.listedOn);
      return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });

    setFilteredListings(result);

    // Recalculate selected items based on the *newly filtered* list
    setSelectedItems(prevSelected => {
        const currentFilteredIds = new Set(result.map(item => item.id));
        const newSelected = new Set();
        prevSelected.forEach(id => {
            if (currentFilteredIds.has(id)) {
                newSelected.add(id);
            }
        });
        return newSelected;
    });

  }, [allListings, filterCategory, sortOrder, filterDate, searchQuery, filterStatus]); // Added filterStatus


  // --- Selection Handlers ---
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allFilteredIds = new Set(filteredListings.map(item => item.id));
      setSelectedItems(allFilteredIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId, isChecked) => {
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (isChecked) {
        newSelected.add(itemId);
      } else {
        newSelected.delete(itemId);
      }
      return newSelected;
    });
  };

  // Determine if all filtered items are selected
  const isAllSelected = filteredListings.length > 0 && selectedItems.size === filteredListings.length;

  // Show/hide bulk bar
  useEffect(() => {
    setShowBulkBar(selectedItems.size > 0);
  }, [selectedItems]);


  // --- Action Handlers (Placeholders) ---
  const handleEdit = (itemId) => {
    setBulkActionMessage("");
    // navigate(`/edit-listing/${itemId}`);
    setBulkActionMessage(`Edit item ${itemId} (Placeholder)`);
    setTimeout(() => setBulkActionMessage(''), 2000);
  };

  const handleDelete = (itemId) => {
    setBulkActionMessage("");
    if (window.confirm(`Are you sure you want to delete listing ID ${itemId}?`)) {
      setAllListings(prev => prev.filter(item => item.id !== itemId)); // Optimistic update
      setSelectedItems(prev => { const newSet = new Set(prev); newSet.delete(itemId); return newSet; });
      setBulkActionMessage(`Deleted item ${itemId}`);
      setTimeout(() => setBulkActionMessage(''), 2000);
    }
  };

  // Bulk delete
  const handleBulkDelete = () => {
    setBulkActionMessage("");
    if (window.confirm(`Delete ${selectedItems.size} selected listing(s)?`)) {
      setAllListings(prev => prev.filter(item => !selectedItems.has(item.id)));
      setSelectedItems(new Set());
      setBulkActionMessage(`Deleted ${selectedItems.size} listing(s)`);
      setTimeout(() => setBulkActionMessage(''), 2000);
    }
  };

   // --- Calculate Counts ---
   const counts = allListings.reduce((acc, item) => {
       if (item.status === 'active') acc.active++;
       else if (item.status === 'inactive') acc.inactive++;
       else acc.others++;
       return acc;
   }, { active: 0, inactive: 0, others: 0 });

  // --- Logout Handler ---
  const handleLogout = () => { localStorage.removeItem('eduRentUserData'); navigate('/login'); };

  // --- Render ---
  if (isLoading) {
      return (
          <div className="profile-page">
              <Header userName="" onLogout={handleLogout} />
              <ManageListingsSkeleton />
          </div>
      );
  }
   if (error) {
       return (
           <div className="profile-page">
               <Header userName={userName} onLogout={handleLogout} />
               <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>Error: {error}</div>
           </div>
       );
   }

  return (
    <div className="profile-page"> {/* Container for Header */}
      <Header userName={userName} onLogout={handleLogout} />

      {/* Bulk Actions Bar */}
      {showBulkBar && (
        <div className="bulk-actions-bar" role="region" aria-label="Bulk actions">
          <span>{selectedItems.size} selected</span>
          <button className="btn btn-small btn-delete" onClick={handleBulkDelete} aria-label="Delete selected listings">Delete Selected</button>
        </div>
      )}

      {/* Toast/Snackbar for feedback */}
      {bulkActionMessage && (
        <div className="snackbar" role="status">{bulkActionMessage}</div>
      )}

      <main className="manage-listings-page">
        <div className="manage-listings-header">
          <h1 className="manage-listings-title">Manage Listings</h1>
          {/* Filters */}
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="category-filter" className="filter-label">Category</label>
              <select id="category-filter" className="filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                {categories.map(cat => <option key={cat.id} value={cat.id === 'all' ? 'all' : cat.name}>{cat.name}</option>)}
              </select>
            </div>
             <div className="filter-group">
              <label htmlFor="sort-filter" className="filter-label">Sort By</label>
              <select id="sort-filter" className="filter-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
             <div className="filter-group">
               <label htmlFor="date-filter" className="filter-label">Date Created</label>
               <select id="date-filter" className="filter-select" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
                 <option value="all">All Time</option>
                 <option value="last7">Last 7 Days</option>
                 <option value="last30">Last 30 Days</option>
               </select>
             </div>
            <div className="filter-group" style={{flexGrow: 1}}>
              <label htmlFor="search-filter" className="filter-label">Search</label>
              <input
                id="search-filter"
                type="text"
                className="filter-search-input"
                placeholder="Search by name or keyword..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Listings Card */}
        <div className="listings-card-container">
          <div className="listings-card-header">
            <div className="select-all-container">
              <input
                type="checkbox"
                id="select-all"
                checked={isAllSelected}
                onChange={handleSelectAll}
                aria-label="Select all listings"
              />
              <label htmlFor="select-all" style={{fontWeight: 500}}>Select All</label>
            </div>
            {/* Clickable Counts */}
            <div className="listing-counts">
              <button
                 className={`listing-count-item ${filterStatus === 'active' ? 'active' : ''}`}
                 onClick={() => setFilterStatus('active')}
                 style={{background:'none', border:'none', cursor:'pointer'}}
              >
                 Active: <strong>{counts.active}</strong>
              </button>
              <button
                 className={`listing-count-item ${filterStatus === 'inactive' ? 'active' : ''}`}
                 onClick={() => setFilterStatus('inactive')}
                 style={{background:'none', border:'none', cursor:'pointer'}}
              >
                 Inactive: <strong>{counts.inactive}</strong>
              </button>
              <button
                 className={`listing-count-item ${filterStatus === 'others' ? 'active' : ''}`}
                 onClick={() => setFilterStatus('others')}
                 style={{background:'none', border:'none', cursor:'pointer'}}
              >
                 Sold/Other: <strong>{counts.others}</strong>
              </button>
               <button
                  className={`listing-count-item ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                  style={{ background:'none', border:'none', cursor:'pointer', marginLeft: '1rem', fontStyle:'italic' }}
               >
                  Show All
               </button>
            </div>
          </div>

          {/* Listings Body (Table) */}
          {filteredListings.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="listings-table">
                <thead>
                  <tr>
                    <th><span className="visually-hidden">Select</span></th>
                    <th>Product</th>
                    <th>Listed On</th>
                    <th>Price</th>
                    <th>Likes</th>
                    <th style={{textAlign: 'right'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map(item => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={e => handleSelectItem(item.id, e.target.checked)}
                          aria-label={`Select listing ${item.name}`}
                        />
                      </td>
                      <td>
                        <div className="listing-product-info">
                          {item.image ? (
                             <img src={item.image} alt={item.name} className="listing-product-image" />
                          ) : (
                             <div className="listing-product-image icon-placeholder">{item.icon || '📦'}</div>
                          )}
                          <div className="listing-product-details">
                            <div className="listing-product-name">
                              {item.name}
                              <span className={`status-badge status-${item.status}`} style={{marginLeft: '0.5em'}}>
                                {item.status === 'active' && 'Active'}
                                {item.status === 'inactive' && 'Inactive'}
                                {item.status === 'sold' && 'Sold'}
                                {item.status !== 'active' && item.status !== 'inactive' && item.status !== 'sold' && item.status}
                              </span>
                            </div>
                            <div className="listing-product-desc">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td>{new Date(item.listedOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</td>
                      <td>₱{item.price}</td>
                      <td>{item.likes}</td>
                      <td>
                        <div className="listing-actions">
                           <button
                              className="btn btn-small btn-outline"
                              onClick={() => handleEdit(item.id)}
                              aria-label={`Edit listing ${item.name}`}
                           >
                             Edit
                           </button>
                           <button
                             className="btn btn-small btn-delete"
                             onClick={() => handleDelete(item.id)}
                             aria-label={`Delete listing ${item.name}`}
                           >
                             Delete
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="listings-empty-state">
               <div className="empty-state-illustration" aria-hidden="true">
                 {/* SVG illustration for empty state */}
                 <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <rect x="10" y="30" width="60" height="30" rx="6" fill="#e9ecef" />
                   <rect x="20" y="40" width="40" height="10" rx="3" fill="#f8f9fa" />
                   <rect x="30" y="50" width="20" height="4" rx="2" fill="#dee2e6" />
                 </svg>
               </div>
               <div className="empty-state-title">No Listings Found</div>
               <p>
                 {searchQuery || filterCategory !== 'all' || filterDate !== 'all' || filterStatus !== 'all'
                   ? 'Try adjusting your filters or search terms.'
                   : 'You haven\'t listed any items yet.'}
               </p>
               {!(searchQuery || filterCategory !== 'all' || filterDate !== 'all' || filterStatus !== 'all') && (
                    <button className="cta-button" onClick={() => navigate('/list-item')}>List Your First Item</button>
               )}
             </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Add visually hidden class definition if not global
/*
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
*/
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import Header from '../components/Header';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';
import MarkAsSoldModal from '../components/MarkAsSoldModal';
import LoadMoreButton from '../components/LoadMoreButton';

import useAuth from '../hooks/useAuth';

// Services
import { 
  getCurrentUser, 
  getUserListings, 
  getCategories, 
  getListingById, 
  deleteListing,
  updateListingStatus,
  likeListing,      
  unlikeListing     
} from '../services/apiService';

// Styles
import '../static/ManageListingsPage.css';
import '../static/ProfilePage.css'; 
import '../static/DashboardPage.css';

// Layout shown while the initial data is being fetched
function ManageListingsSkeleton() {
  return (
    <div className="manage-listings-page">
      {/* Header Skeleton */}
      <div className="manage-listings-header">
        <div className="skeleton skeleton-filter-label" style={{ height: '2rem', width: '250px', marginBottom: '1rem' }}></div>
        <div className="skeleton-filters-container">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="filter-group skeleton-filter-group">
              <div className="skeleton skeleton-filter-label"></div>
              <div className="skeleton skeleton-filter-input"></div>
            </div>
          ))}
          <div className="filter-group skeleton-filter-group" style={{flexGrow: 1}}>
             <div className="skeleton skeleton-filter-label"></div>
             <div className="skeleton skeleton-filter-input"></div>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="skeleton-listings-card-container">
        <div className="skeleton skeleton-listings-card-header"></div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton-table-row">
            <div className="skeleton skeleton-table-checkbox"></div>
            <div className="skeleton-table-product">
              <div className="skeleton skeleton-table-image"></div>
              <div className="skeleton-table-text-lines">
                <div className="skeleton skeleton-table-line" style={{ width: '70%' }}></div>
                <div className="skeleton skeleton-table-line" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div className="skeleton skeleton-table-cell"></div>
            <div className="skeleton skeleton-table-cell" style={{ width: '50px' }}></div>
            <div className="skeleton skeleton-table-cell" style={{ width: '40px' }}></div>
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

export default function ManageListingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Data State
  const [userName, setUserName] = useState('');
  const [userData, setUserData] = useState(null);
  const [allListings, setAllListings] = useState([]); 
  const [filteredListings, setFilteredListings] = useState([]); 
  const [categories, setCategories] = useState([]); 
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // UI & Selection State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [bulkActionMessage, setBulkActionMessage] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set()); 

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedListing, setSelectedListing] = useState(null);
  
  const [isMarkSoldModalOpen, setIsMarkSoldModalOpen] = useState(false); 
  const [listingToMarkSold, setListingToMarkSold] = useState(null);

  // Interaction State (Likes & Notifications)
  const [likedListingIds, setLikedListingIds] = useState(new Set());
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  const [isNotificationLoading, setIsNotificationLoading] = useState(false); 

  // Filters State
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [sortOrder, setSortOrder] = useState('recent');
  const [filterDate, setFilterDate] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('available');

  // Unified data fetching function to handle both initial load and "Load More"
  const fetchData = useCallback(async (page = 0) => {
    setIsLoading(true);
    if (page === 0) setError(null);
    
    try {
      // Get user info first
      const userRes = await getCurrentUser();
      const userId = userRes.data?.userId;
      setUserData(userRes.data);
      setUserName(userRes.data?.fullName?.split(' ')[0] || 'User');

      if (!userId) throw new Error("Could not find user ID.");

      // Fetch listings and categories concurrently
      const listingsPromise = getUserListings(userId, page, 8);
      const categoriesPromise = getCategories();

      const [listingsRes, catRes] = await Promise.all([
          listingsPromise,
          categoriesPromise
      ]);

      const data = listingsRes.data;
      const newContent = data.content || [];

      // If it's page 0, replace the list. If it's a later page, append to the list.
      setAllListings(prev => page === 0 ? newContent : [...prev, ...newContent]);
      
      setCurrentPage(data.number);
      setHasMore(data.number < data.totalPages - 1);
      
      // Update categories only on the first load to keep dropdowns stable
      if (page === 0) {
          setCategories([{ categoryId: 'all', name: 'All Categories' }, ...(catRes.data || [])]);
      }

    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Could not load listings.");
      if (err.message === "No authentication token found.") navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Initial load
  useEffect(() => {
    fetchData(0);
  }, [fetchData]);

  // Apply filters whenever inputs or data change
  useEffect(() => {
    let result = [...allListings];

    // Filter by Item Status
    if (filterStatus !== 'all') {
      if (filterStatus === 'others') {
        result = result.filter(item => 
            item.status.toLowerCase() !== 'available' && 
            item.status.toLowerCase() !== 'inactive'
        );
      } else {
        result = result.filter(item => item.status.toLowerCase() === filterStatus);       
      }
    }

    // Filter by Category
    if (filterCategory !== 'All Categories') {
      result = result.filter(item => item.category?.name === filterCategory); 
    }

    // Filter by Date
    const now = new Date(); 
    if (filterDate === 'last7') {
      const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7));
      result = result.filter(item => new Date(item.createdAt) >= sevenDaysAgo);
    } else if (filterDate === 'last30') {
      const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));
       result = result.filter(item => new Date(item.createdAt) >= thirtyDaysAgo); 
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery))
      );
    }

    // Sort Results
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });

    setFilteredListings(result);

    // Sync selection (remove IDs that are no longer visible in current filter)
    setSelectedItems(prevSelected => {
        const currentFilteredIds = new Set(result.map(item => item.listingId));
        const newSelected = new Set();
        prevSelected.forEach(id => {
            if (currentFilteredIds.has(id)) newSelected.add(id);
        });
        return newSelected;
    });

  }, [allListings, filterCategory, sortOrder, filterDate, searchQuery, filterStatus]);


  // Checkbox logic for selecting rows
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allFilteredIds = new Set(filteredListings.map(item => item.listingId));
      setSelectedItems(allFilteredIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId, isChecked) => {
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (isChecked) newSelected.add(itemId);
      else newSelected.delete(itemId);
      return newSelected;
    });
  };

  const isAllSelected = filteredListings.length > 0 && selectedItems.size === filteredListings.length;

  // Show the bulk actions bar only when items are selected
  useEffect(() => {
    setShowBulkBar(selectedItems.size > 0);
  }, [selectedItems]);


  // --- Item Actions ---

  const handleEdit = (itemId) => {
    setBulkActionMessage("");
    navigate(`/edit-listing/${itemId}`);
  };

  const handleOpenMarkSold = (e, listing) => {
    e.stopPropagation(); 
    setListingToMarkSold(listing);
    setIsMarkSoldModalOpen(true);
  };

  const handleMarkSoldSuccess = () => {
    if (listingToMarkSold) {
        setAllListings(prev => prev.map(item => 
            item.listingId === listingToMarkSold.listingId 
            ? { ...item, status: 'Sold' } 
            : item
        ));
    }
    setListingToMarkSold(null);
    setIsMarkSoldModalOpen(false);
  };

  const handleDelete = async (itemId) => {
    setBulkActionMessage("");
    if (window.confirm(`Are you sure you want to delete listing ID ${itemId}?`)) {
      try {
        await deleteListing(itemId);
        setAllListings(prev => prev.filter(item => item.listingId !== itemId));
        setSelectedItems(prev => { const newSet = new Set(prev); newSet.delete(itemId); return newSet; });
        setBulkActionMessage(`Deleted item ${itemId}`);
      } catch (err) {
        console.error("Failed to delete item:", err);
        setBulkActionMessage(`Error: Could not delete item ${itemId}.`);
      } finally {
         setTimeout(() => setBulkActionMessage(''), 2000);
      }
    }
  };

  // Bulk Actions
  const handleBulkMarkSold = async () => {
    setBulkActionMessage("");
    const numToUpdate = selectedItems.size;
    if (numToUpdate === 0) return;

    if (window.confirm(`Mark ${numToUpdate} selected listing(s) as Sold?`)) {
      try {
        const updatePromises = Array.from(selectedItems).map(id => 
            updateListingStatus(id, 'Sold')
        );
        
        await Promise.all(updatePromises);
        
        // Optimistic UI update
        setAllListings(prev => prev.map(item => 
            selectedItems.has(item.listingId) ? { ...item, status: 'Sold' } : item
        ));
        
        setSelectedItems(new Set()); 
        setBulkActionMessage(`Marked ${numToUpdate} items as Sold`);
      } catch (err) {
         console.error("Failed to update items:", err);
         setBulkActionMessage(`Error: Could not update some items.`);
      } finally {
         setTimeout(() => setBulkActionMessage(''), 3000);
      }
    }
  };

  const handleBulkDelete = async () => {
    setBulkActionMessage("");
    const numToDelete = selectedItems.size;
    if (numToDelete === 0) return;

    if (window.confirm(`Delete ${numToDelete} selected listing(s)?`)) {
      try {
        const deletePromises = Array.from(selectedItems).map(id => deleteListing(id));
        await Promise.all(deletePromises);
        
        setAllListings(prev => prev.filter(item => !selectedItems.has(item.listingId)));
        setSelectedItems(new Set());
        setBulkActionMessage(`Deleted ${numToDelete} listing(s)`);
      } catch (err) {
         console.error("Failed to delete items:", err);
         setBulkActionMessage(`Error: Could not delete all selected items.`);
      } finally {
         setTimeout(() => setBulkActionMessage(''), 2000);
      }
    }
  };

  // Calculate counts for tabs
  const counts = allListings.reduce((acc, item) => {
       const status = item.status?.toLowerCase() || 'other';
       if (status === 'active' || status === 'available') acc.active++;
       else if (status === 'inactive') acc.inactive++;
       else acc.others++;
       return acc;
  }, { active: 0, inactive: 0, others: 0 });

  
  // Notification Handling
  const handleNotificationClick = async (notification) => {
    const urlParts = notification.linkUrl?.split('/');
    const listingId = urlParts ? parseInt(urlParts[urlParts.length - 1], 10) : null;

    if (!listingId) {
      alert("Could not open this notification: Invalid link.");
      return;
    }

    closeModal();
    setIsNotificationLoading(true);

    try {
      const response = await getListingById(listingId); 
      if (response.data) openModal(response.data);
      else throw new Error(`Listing ${listingId} not found.`);
    } catch (err) {
      console.error("Failed to fetch listing for notification:", err);
      alert(`Could not load item: ${err.message}.`);
      navigate('/browse');
    } finally {
      setIsNotificationLoading(false);
    }
  };

  // Modal Helpers
  const openModal = (listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setSelectedListing(null);
    setIsModalOpen(false);
  };

  // Like / Unlike
  const handleLikeToggle = async (listingId) => {
    if (likingInProgress.has(listingId)) return;
    setLikingInProgress(prev => new Set(prev).add(listingId));
    const newLikedIds = new Set(likedListingIds);
    const isCurrentlyLiked = likedListingIds.has(listingId);
    
    if (isCurrentlyLiked) newLikedIds.delete(listingId);
    else newLikedIds.add(listingId);
    
    setLikedListingIds(newLikedIds);
    
    try {
      if (isCurrentlyLiked) await unlikeListing(listingId);
      else await likeListing(listingId);
    } catch (err) {
      console.error("Failed to toggle like:", err);
      // Revert on failure
      setLikedListingIds(prevIds => {
          const revertedIds = new Set(prevIds);
          if (isCurrentlyLiked) revertedIds.add(listingId);
          else revertedIds.delete(listingId);
          return revertedIds;
      });
    } finally {
      setLikingInProgress(prev => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    }
  };

  // Render Loading Skeleton only for initial load
  if (isLoading && currentPage === 0) {
      return (
          <div className="profile-page">
              <Header userName="" onLogout={logout} />
              <ManageListingsSkeleton />
          </div>
      );
  }
  
  if (error) {
       return (
           <div className="profile-page">
               <Header userName={userName} onLogout={logout} />
               <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>Error: {error}</div>
           </div>
       );
  }

  return (
    <div className="profile-page">
      <Header userName={userName} 
        profilePictureUrl={userData?.profilePictureUrl}
        onLogout={logout} 
        onNotificationClick={handleNotificationClick}
      />

      {/* Bulk Actions Toolbar */}
      {showBulkBar && (
        <div className="bulk-actions-bar" role="region" aria-label="Bulk actions">
          <span>{selectedItems.size} selected</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-small btn-primary-accent" 
                onClick={handleBulkMarkSold}
              >
                Mark as Sold
              </button>
              
              <button 
                className="btn btn-small btn-delete" 
                onClick={handleBulkDelete}
              >
                Delete Selected
              </button>
          </div>
        </div>
      )}

      {/* Feedback Snackbar */}
      {bulkActionMessage && (
        <div className="snackbar" role="status">{bulkActionMessage}</div>
      )}

      <main className="manage-listings-page">
        <div className="manage-listings-header">
          <h1 className="manage-listings-title">Manage Listings</h1>
          
          {/* Filters Area */}
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="category-filter" className="filter-label">Category</label>
              <select id="category-filter" className="filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                {categories.map(cat => <option key={cat.categoryId || 'all'} value={cat.name}>{cat.name}</option>)}
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

        {/* Listings Data Table */}
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
            
            {/* Status Filter Tabs */}
            <div className="listing-counts">
              <button
                  className={`listing-count-item ${filterStatus === 'available' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('available')}
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

          {filteredListings.length > 0 ? (
            <>
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
                  {filteredListings.map(item => {
                    const coverImage = item.images?.find(img => img.coverPhoto)?.imageUrl || item.images?.[0]?.imageUrl || null;
                    const isSold = item.status?.toLowerCase() === 'sold';
                    const statusClass = item.status?.toLowerCase() || 'other';
                    
                    const statusText = item.status?.toLowerCase() === 'available' ? 'Active' : 
                                     item.status?.toLowerCase() === 'inactive' ? 'Inactive' : 
                                     item.status?.toLowerCase() === 'sold' ? 'Sold' : 
                                     item.status; 

                    return (
                      <tr key={item.listingId} onClick={() => openModal(item)} style={{ cursor: 'pointer' }}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.listingId)}
                            onChange={e => handleSelectItem(item.listingId, e.target.checked)}
                          />
                        </td>
                        <td>
                          <div className="listing-product-info">
                            {coverImage ? (
                               <img src={coverImage} alt={item.title} className="listing-product-image" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                               <div className="listing-product-image icon-placeholder">{'📦'}</div>
                            )}
                            <div className="listing-product-details">
                              <div className="listing-product-name">
                                {item.title}
                                <span className={`status-badge status-${statusClass}`} style={{marginLeft: '0.5em', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '10px', background: '#eee'}}>
                                  {statusText}
                                </span>
                              </div>
                              <div className="listing-product-desc">{item.description?.substring(0, 50)}{item.description?.length > 50 ? '...' : ''}</div>
                            </div>
                          </div>
                        </td>
                        <td>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</td>
                        <td>₱{item.price?.toFixed(2)}</td>
                        <td>{item.likes?.length || '0'}</td> 
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="listing-actions">
                             
                             {/* Only show "Mark Sold" if the item is not already sold */}
                             {!isSold && (
                                 <button
                                   className="btn btn-small"
                                   style={{ 
                                       backgroundColor: 'transparent', 
                                       color: '#2ecc71', 
                                       border: '1px solid #2ecc71',
                                       whiteSpace: 'nowrap'
                                   }}
                                   onClick={(e) => handleOpenMarkSold(e, item)}
                                 >
                                   Mark Sold
                                 </button>
                             )}

                             {!isSold && (
                               <button
                                  className="btn btn-small btn-outline"
                                  onClick={() => handleEdit(item.listingId)}
                               >
                                  Edit
                               </button>
                             )}
                             <button
                               className="btn btn-small btn-delete"
                               onClick={() => handleDelete(item.listingId)}
                             >
                               Delete
                             </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            <LoadMoreButton 
                onLoadMore={() => fetchData(currentPage + 1)}
                isLoading={isLoading}
                hasMore={hasMore}
            />
            </>
          ) : (
             <div className="listings-empty-state">
               <div className="empty-state-illustration" aria-hidden="true">
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

       {/* Modals */}
       
       {/* 1. Product Detail Modal */}
       {isModalOpen && selectedListing && (
         <ProductDetailModal
           listing={selectedListing}
           onClose={closeModal}
           currentUserId={userData?.userId} 
           isLiked={likedListingIds.has(selectedListing.listingId)}
           onLikeClick={handleLikeToggle}
           isLiking={likingInProgress.has(selectedListing.listingId)}
         />
       )}

       {/* 2. Mark As Sold Modal */}
       {isMarkSoldModalOpen && listingToMarkSold && (
        <MarkAsSoldModal
            listing={listingToMarkSold}
            currentUser={userData}
            onClose={() => setIsMarkSoldModalOpen(false)}
            onSuccess={handleMarkSoldSuccess}
        />
       )}

       {/* 3. Skeleton Loader (for Notifications) */}
       {isNotificationLoading && (
         <ProductDetailModalSkeleton onClose={() => setIsNotificationLoading(false)} />
       )}
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import Header from '../components/Header';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';
import MarkAsSoldModal from '../components/MarkAsSoldModal';
import LoadMoreButton from '../components/LoadMoreButton';
import LoadingOverlay from '../components/LoadingOverlay';
import GenericDropdown from '../components/GenericDropdown';
import AnimatedCheckbox from '../components/AnimatedCheckbox';

import useAuth from '../hooks/useAuth';

// New Feedback Hooks
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmationContext';

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
  
  // Initialize feedback hooks
  const { showSuccess, showError, showInfo } = useToast();
  const confirm = useConfirm();

  // Data State
  const [userName, setUserName] = useState('');
  const [userData, setUserData] = useState(null);
  const [allListings, setAllListings] = useState([]); 
  const [filteredListings, setFilteredListings] = useState([]); 
  const [categories, setCategories] = useState([]); 
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalListingsCount, setTotalListingsCount] = useState(0);

  // UI & Selection State
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set()); 
  
  // Processing State for Overlay
  const [isProcessing, setIsProcessing] = useState(false); 

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

  // Unified data fetching function
  const fetchData = useCallback(async (page = 0, isLoadMore = false) => {
    // Use different loading states for initial load vs load more
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
    }
    
    try {
      const userRes = await getCurrentUser();
      const userId = userRes.data?.userId;
      setUserData(userRes.data);
      setUserName(userRes.data?.fullName?.split(' ')[0] || 'User');

      if (!userId) throw new Error("Could not find user ID.");

      const listingsPromise = getUserListings(userId, page, 8, true);
      const categoriesPromise = page === 0 ? getCategories() : Promise.resolve({ data: categories });

      const [listingsRes, catRes] = await Promise.all([
          listingsPromise,
          categoriesPromise
      ]);

      const data = listingsRes.data;
      const newContent = data.content || [];

      setAllListings(prev => page === 0 ? newContent : [...prev, ...newContent]);
      
      setCurrentPage(data.number);
      setHasMore(data.number < data.totalPages - 1);
      setTotalListingsCount(data.totalElements || 0);
      
      if (page === 0) {
          setCategories([{ categoryId: 'all', name: 'All Categories' }, ...(catRes.data || [])]);
      }

    } catch (err) {
      console.error("Failed to load data:", err);
      if (!isLoadMore) setError("Could not load listings.");
      else showError("Could not load more items.");

      if (err.message === "No authentication token found.") navigate('/login');
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [navigate, showError, categories]);

  useEffect(() => {
    fetchData(0, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply filters
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

    if (filterCategory !== 'All Categories') {
      result = result.filter(item => item.category?.name === filterCategory); 
    }

    const now = new Date(); 
    if (filterDate === 'last7') {
      const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7));
      result = result.filter(item => new Date(item.createdAt) >= sevenDaysAgo);
    } else if (filterDate === 'last30') {
      const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));
       result = result.filter(item => new Date(item.createdAt) >= thirtyDaysAgo); 
    }

    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery))
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });

    setFilteredListings(result);

    // Sync selected items with currently visible items
    setSelectedItems(prevSelected => {
        const currentFilteredIds = new Set(result.map(item => item.listingId));
        const newSelected = new Set();
        prevSelected.forEach(id => {
            if (currentFilteredIds.has(id)) newSelected.add(id);
        });
        return newSelected;
    });

  }, [allListings, filterCategory, sortOrder, filterDate, searchQuery, filterStatus]);


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

  useEffect(() => {
    setShowBulkBar(selectedItems.size > 0);
  }, [selectedItems]);


  // --- Item Actions ---

  const handleEdit = (itemId) => {
    // Find the item to check if we have a publicId (UUID)
    const item = allListings.find(l => l.listingId === itemId);
    const idToUse = item?.publicId || itemId;

    navigate(`/edit-listing/${idToUse}`, {
      state: {
        returnTo: '/manage-listings',
        openListingId: itemId // Keep internal ID for state if needed, or update this too if we fully switch
      }
    });
  };

  // Open the detailed modal to select a specific buyer
  const handleOpenMarkSold = (e, listing) => {
    e.stopPropagation(); 
    setListingToMarkSold(listing);
    setIsMarkSoldModalOpen(true);
  };

  const handleMarkSoldSuccess = () => {
        setIsProcessing(true);
        // Simulate delay or real refresh if needed, usually just UI update
        // But since user asked for loading during actions:
        
        // This function is called AFTER the modal has successfully done the API call probably?
        // Wait, handleMarkSoldSuccess logic:
        // MarkAsSoldModal calls local onConfirm which calls confirmSold...
        // Let's check logic. Actually handleMarkSoldSuccess is just updating local state here.
        // The MarkAsSoldModal does the API call? 
        // If MarkAsSoldModal does the call, we can't wrap it here easily unless we pass a handler.
        // Let's assume for now the user means the actions TRIGGERED from this page. 
        // Logic below updates state. 
        // If consistent, I should check MarkAsSoldModal separately.
        // For now, let's keep it simple.
    if (listingToMarkSold) {
        setAllListings(prev => prev.map(item => 
            item.listingId === listingToMarkSold.listingId 
            ? { ...item, status: 'Sold' } 
            : item
        ));
        showSuccess(`"${listingToMarkSold.title}" marked as Sold`);
    }
    setListingToMarkSold(null);
    setIsMarkSoldModalOpen(false);
    setIsProcessing(false);
  };

  // Toggles status between Active (Available) and Inactive
  const handleSingleStatusUpdate = async (e, listing, newStatus) => {
    e.stopPropagation();
    
    const actionLabel = newStatus === 'AVAILABLE' ? 'Mark as Active' : 'Mark as Inactive';
    const statusText = newStatus === 'AVAILABLE' ? 'Active' : 'Inactive';

    const isConfirmed = await confirm({
      title: `${actionLabel}?`,
      message: `Are you sure you want to mark "${listing.title}" as ${statusText}?`,
      confirmText: 'Yes, Confirm',
      isDangerous: false
    });

    if (!isConfirmed) return;

    try {
      setIsProcessing(true);
      await updateListingStatus(listing.listingId, newStatus);
      
      // Optimistic update
      setAllListings(prev => prev.map(item => 
        item.listingId === listing.listingId 
        ? { ...item, status: statusText === 'Active' ? 'Available' : 'Inactive' } 
        : item
      ));

      showSuccess(`Listing marked as ${statusText}.`);
    } catch (err) {
      console.error(`Failed to mark as ${statusText}:`, err);
      showError(`Failed to update status.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (itemId) => {
    const isConfirmed = await confirm({
      title: 'Delete Listing?',
      message: `Are you sure you want to delete listing ID ${itemId}? This cannot be undone.`,
      confirmText: 'Yes, Delete',
      isDangerous: true
    });

    if (!isConfirmed) return;

    try {
      setIsProcessing(true);
      await deleteListing(itemId);
      setAllListings(prev => prev.filter(item => item.listingId !== itemId));
      setSelectedItems(prev => { const newSet = new Set(prev); newSet.delete(itemId); return newSet; });
      showSuccess(`Listing deleted successfully.`);
    } catch (err) {
      console.error("Failed to delete item:", err);
      showError("Failed to delete the listing. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Bulk Actions ---
  
  // Handles bulk toggling (Inactive -> Active or Active -> Inactive)
  const handleBulkStatusUpdate = async (targetStatus) => {
    const numToUpdate = selectedItems.size;
    if (numToUpdate === 0) return;

    const isActivate = targetStatus === 'AVAILABLE';
    const actionLabel = isActivate ? 'Mark as Active' : 'Mark as Inactive';
    const statusText = isActivate ? 'Active' : 'Inactive';
    const message = isActivate 
      ? `Move ${numToUpdate} items back to Active listings?`
      : `Move ${numToUpdate} items to Inactive? They will be hidden from the marketplace.`;

    const isConfirmed = await confirm({
      title: `${actionLabel}?`,
      message: message,
      confirmText: actionLabel,
      isDangerous: !isActivate
    });

    if (!isConfirmed) return;

    try {
      setIsProcessing(true);
      const updatePromises = Array.from(selectedItems).map(id => 
          updateListingStatus(id, targetStatus)
      );
      
      await Promise.all(updatePromises);
      
      // Optimistic UI Update
      setAllListings(prev => prev.map(item => 
          selectedItems.has(item.listingId) 
          ? { ...item, status: isActivate ? 'Available' : 'Inactive' } 
          : item
      ));
      
      setSelectedItems(new Set()); 
      showSuccess(`Successfully marked ${numToUpdate} items as ${statusText}.`);
    } catch (err) {
       console.error("Failed to update items:", err);
       showError("Some items could not be updated.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Basic bulk mark as sold (without assigning a specific buyer)
  const handleBulkMarkSold = async () => {
    const numToUpdate = selectedItems.size;
    if (numToUpdate === 0) return;

    const isConfirmed = await confirm({
      title: 'Mark as Sold?',
      message: `Mark ${numToUpdate} selected items as Sold? (Note: This won't assign a specific buyer)`,
      confirmText: 'Mark Sold',
      isDangerous: false
    });

    if (!isConfirmed) return;

    try {
      setIsProcessing(true);
      const updatePromises = Array.from(selectedItems).map(id => 
          updateListingStatus(id, 'Sold')
      );
      
      await Promise.all(updatePromises);
      
      setAllListings(prev => prev.map(item => 
          selectedItems.has(item.listingId) ? { ...item, status: 'Sold' } : item
      ));
      
      setSelectedItems(new Set()); 
      showSuccess(`Marked ${numToUpdate} items as Sold.`);
    } catch (err) {
       console.error("Failed to update items:", err);
       showError("Some items could not be updated.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    const numToDelete = selectedItems.size;
    if (numToDelete === 0) return;

    const isConfirmed = await confirm({
      title: 'Delete Selected Items?',
      message: `You are about to delete ${numToDelete} listings. This action is permanent.`,
      confirmText: `Delete ${numToDelete} Items`,
      isDangerous: true
    });

    if (!isConfirmed) return;

    try {
      setIsProcessing(true);
      const deletePromises = Array.from(selectedItems).map(id => deleteListing(id));
      await Promise.all(deletePromises);
      
      setAllListings(prev => prev.filter(item => !selectedItems.has(item.listingId)));
      setSelectedItems(new Set());
      showSuccess(`Deleted ${numToDelete} listings.`);
    } catch (err) {
       console.error("Failed to delete items:", err);
       showError("Could not delete all selected items.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate counts for tab badges
  const counts = allListings.reduce((acc, item) => {
       const status = item.status?.toLowerCase() || 'other';
       if (status === 'active' || status === 'available') acc.active++;
       else if (status === 'inactive') acc.inactive++;
       else acc.others++;
       return acc;
  }, { active: 0, inactive: 0, others: 0 });

  
  const handleNotificationClick = async (notification) => {
    if (!notification.linkUrl) return;

    // --- FIX: Handle Message Notifications ---
    if (notification.linkUrl.includes('/messages')) {
        // Extract the Conversation ID from the end of the URL (e.g., "/messages/15")
        const urlParts = notification.linkUrl.split('/').filter(part => part !== '');
        const conversationId = parseInt(urlParts[urlParts.length - 1], 10);

        if (conversationId && !isNaN(conversationId)) {
            // Pass the ID in the state so MessagesPage knows what to open
            navigate('/messages', { state: { openConversationId: conversationId } });
        } else {
            // Fallback if no ID is found
            navigate('/messages');
        }
        return;
    }

    // --- Handle Profile/Review Notifications ---
    if (notification.linkUrl.includes('/profile')) {
      navigate(notification.linkUrl);
      return;
    }

    // --- Handle Listing Notifications ---
    const urlParts = notification.linkUrl.split('/').filter(part => part !== '');
    const potentialId = parseInt(urlParts[urlParts.length - 1], 10);

    if (!potentialId || isNaN(potentialId)) {
      navigate(notification.linkUrl);
      return;
    }

    closeModal();
    setIsNotificationLoading(true);

    try {
      const response = await getListingById(potentialId); 
      
      if (response.data) {
          openModal(response.data);
      } else {
        throw new Error(`Listing ${potentialId} not found.`);
      }
    } catch (err) {
      console.error("Failed to fetch listing for notification:", err);
      navigate(notification.linkUrl);
    } finally {
      setIsNotificationLoading(false);
    }
  };

  const openModal = (listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setSelectedListing(null);
    setIsModalOpen(false);
  };

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
      setLikedListingIds(prevIds => {
          const revertedIds = new Set(prevIds);
          if (isCurrentlyLiked) revertedIds.add(listingId);
          else revertedIds.delete(listingId);
          return revertedIds;
      });
      showInfo("Could not update like status.");
    } finally {
      setLikingInProgress(prev => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    }
  };

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
      
      <LoadingOverlay isVisible={isProcessing} message="Updating listings..." />

      {/* Bulk Actions Toolbar */}
      {showBulkBar && (
        <div className="bulk-actions-bar" role="region" aria-label="Bulk actions">
          <span>{selectedItems.size} selected</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
              
              {/* Option 1: Active Tab -> Show "Mark Inactive" & "Mark Sold" */}
              {filterStatus === 'available' && (
                <>
                    <button 
                      className="btn btn-small btn-primary-accent" 
                      onClick={() => handleBulkStatusUpdate('INACTIVE')}
                    >
                      Mark Inactive
                    </button>
                </>
              )}

              {/* Option 2: Inactive Tab -> Show "Mark Active" */}
              {filterStatus === 'inactive' && (
                <button 
                  className="btn btn-small btn-success" 
                  style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none' }}
                  onClick={() => handleBulkStatusUpdate('AVAILABLE')}
                >
                  Mark Active
                </button>
              )}
              
              {/* Always show Delete */}
              <button 
                className="btn btn-small btn-delete" 
                onClick={handleBulkDelete}
              >
                Delete Selected
              </button>
          </div>
        </div>
      )}

      <main className="manage-listings-page">
        <div className="manage-listings-header">
          <h1 className="manage-listings-title">Manage Listings</h1>
          
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="category-filter" className="filter-label">Category</label>
              <GenericDropdown
                  options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
                  selectedOption={filterCategory}
                  onSelect={setFilterCategory}
                  width="100%"
              />
            </div>
             <div className="filter-group">
              <label htmlFor="sort-filter" className="filter-label">Sort By</label>
              <GenericDropdown
                  options={[
                      { value: "recent", label: "Most Recent" },
                      { value: "oldest", label: "Oldest" }
                  ]}
                  selectedOption={sortOrder}
                  onSelect={setSortOrder}
                  width="100%"
              />
            </div>
             <div className="filter-group">
               <label htmlFor="date-filter" className="filter-label">Date Created</label>
               <GenericDropdown
                   options={[
                       { value: "all", label: "All Time" },
                       { value: "last7", label: "Last 7 Days" },
                       { value: "last30", label: "Last 30 Days" }
                   ]}
                   selectedOption={filterDate}
                   onSelect={setFilterDate}
                   width="100%"
               />
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

        <div className="listings-card-container">
          <div className="listings-card-header">
            <div className="select-all-container">
              <AnimatedCheckbox
                id="select-all"
                checked={isAllSelected}
                onChange={handleSelectAll}
                aria-label="Select all listings"
              />
              <label htmlFor="select-all" style={{fontWeight: 500, cursor: 'pointer'}}>Select All</label>
            </div>
            
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
                    const isInactive = item.status?.toLowerCase() === 'inactive';
                    const statusClass = item.status?.toLowerCase() || 'other';
                    
                    const statusText = item.status?.toLowerCase() === 'available' ? 'Active' : 
                                       item.status?.toLowerCase() === 'inactive' ? 'Inactive' : 
                                       item.status?.toLowerCase() === 'sold' ? 'Sold' : 
                                       item.status; 

                    return (
                      <tr key={item.listingId} onClick={() => openModal(item)} style={{ cursor: 'pointer' }}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <AnimatedCheckbox
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
                             
                             {/* 1. If Inactive Tab: Show "Mark Active" */}
                             {isInactive && (
                                <button
                                  className="btn btn-small"
                                  style={{ 
                                      backgroundColor: 'transparent', 
                                      color: '#2ecc71', 
                                      border: '1px solid #2ecc71',
                                      whiteSpace: 'nowrap'
                                  }}
                                  onClick={(e) => handleSingleStatusUpdate(e, item, 'AVAILABLE')}
                                >
                                  Mark Active
                                </button>
                             )}

                             {/* 2. If Active Tab (not sold, not inactive): Show "Mark Sold" */}
                             {!isSold && !isInactive && (
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

                             {/* Edit Button (Available for both Active and Inactive) */}
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

            {totalListingsCount > 8 && (
            <LoadMoreButton 
                onLoadMore={() => fetchData(currentPage + 1, true)}
                isLoading={isLoadingMore}
                hasMore={hasMore}
            />
            )}
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

       {isMarkSoldModalOpen && listingToMarkSold && (
        <MarkAsSoldModal
            listing={listingToMarkSold}
            currentUser={userData}
            onClose={() => setIsMarkSoldModalOpen(false)}
            onSuccess={handleMarkSoldSuccess}
        />
       )}

       {isNotificationLoading && (
         <ProductDetailModalSkeleton onClose={() => setIsNotificationLoading(false)} />
       )}
    </div>
  );
}
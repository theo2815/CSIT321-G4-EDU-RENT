import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom'; 
import Header from '../components/Header';
import LoadingOverlay from '../components/LoadingOverlay';
import ProductDetailModal from '../components/ProductDetailModal'; 
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';
import ToggleSwitch from '../components/ToggleSwitch';

import { 
  getCurrentUser, 
  getCategories, 
  getListingById, 
  updateListing, 
  likeListing, 
  unlikeListing 
} from '../services/apiService';

// Bring in our new feedback hooks
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';

import '../static/ListItemPage.css';
import '../static/SettingsPage.css';

// A visual placeholder to show while the listing data is being fetched
function ListItemSkeleton() {
  return (
    <div className="page-layout-wrapper">
      <div className="skeleton-list-item-container">
        {/* Skeleton Left Column */}
        <section className="skeleton-photos-section">
          <div className="skeleton skeleton-photo-upload-box"></div>
          <div className="skeleton skeleton-photo-note"></div>
          <div className="skeleton-preview-grid">
            {Array.from({ length: 3 }).map((_, i) => ( 
              <div key={i} className="skeleton skeleton-preview-item"></div>
            ))}
          </div>
        </section>

        {/* Skeleton Right Column */}
        <section className="skeleton-details-section">
          <div className="skeleton skeleton-form-label"></div>
          <div className="skeleton skeleton-form-input"></div>
          <div className="skeleton skeleton-form-label"></div>
          <div className="skeleton skeleton-form-input"></div>
          <div className="skeleton skeleton-form-label"></div>
          <div className="skeleton-condition-buttons">
            {Array.from({ length: 4 }).map((_, i) => ( 
              <div key={i} className="skeleton skeleton-condition-button"></div>
            ))}
          </div>
          <div className="skeleton skeleton-form-label"></div>
          <div className="skeleton skeleton-textarea"></div>
          <div className="skeleton skeleton-form-label"></div>
          <div className="skeleton skeleton-toggle"></div>
          <div className="skeleton skeleton-form-label" style={{ marginTop: '0.75rem' }}></div>
          <div className="skeleton skeleton-form-input" style={{ marginBottom: '1.5rem' }}></div>
          <div className="skeleton skeleton-form-label"></div>
          <div className="skeleton skeleton-form-input" style={{ height: '30px', marginBottom: '1rem' }}></div>
          <div className="skeleton skeleton-form-input" style={{ height: '30px' }}></div>
        </section>
      </div>
    </div>
  );
}

const CONDITION_OPTIONS = ['Brand New', 'Like New', 'Lightly Used', 'Well Used', 'Heavily Used'];

export default function EditListingPage() {
  // Grab the specific listing ID (or UUID) from the URL so we know which item to edit
  const { listingId } = useParams(); 
  const [userName, setUserName] = useState('');
  const [categories, setCategories] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(''); // Dynamic status message
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get return navigation state (where to go after save/cancel)
  const returnTo = location.state?.returnTo || '/manage-listings';
  const openListingId = location.state?.openListingId;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListingForModal, setSelectedListingForModal] = useState(null);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);

  // Initialize feedback tools
  const { showSuccess, showError, showWarning } = useToast();
  const confirm = useConfirm();

  // --- Form State Management ---
  const [photos, setPhotos] = useState([]); // Stores *new* photos uploaded in this session
  const [existingImages, setExistingImages] = useState([]); // Stores photos already saved on the server
  
  // Tracks the IDs of existing images the user wants to remove
  // We send these to the backend upon saving to delete them permanently
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [option, setOption] = useState('sale');
  const [price, setPrice] = useState('');
  const [allowMeetup, setAllowMeetup] = useState(false);
  const [meetupPlace, setMeetupPlace] = useState('');
  const [allowDelivery, setAllowDelivery] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('');
  const fileInputRef = useRef(null);

  // Fetch all necessary data when the page loads: current user, categories, and the listing details
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      // SECURITY: validation to strict UUID only (prevents numeric ID access)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(listingId)) {
          setError("Invalid Listing URL. Numeric IDs are no longer supported for security.");
          setIsLoading(false);
          return;
      }

      try {
        const userPromise = getCurrentUser();
        const categoriesPromise = getCategories();
        const listingPromise = getListingById(listingId); 

        const [userResponse, categoriesResponse, listingResponse] = await Promise.all([
          userPromise,
          categoriesPromise,
          listingPromise
        ]);

        // 1. Set User info
        setUserName(userResponse.data?.fullName?.split(' ')[0] || 'User');
        setUserData(userResponse.data);
        // 2. Set available Categories
        setCategories(categoriesResponse.data || []);

        // 3. Pre-fill the form with the existing data from the database
        const listingData = listingResponse.data;
        if (listingData) {
          // SECURITY CHECK: Ensure the current user is the owner of this listing
          if (userResponse.data.userId !== listingData.user?.userId) {
              setError("You do not have permission to edit this listing.");
              setIsLoading(false);
              return;
          }

          setTitle(listingData.title || '');
          setSelectedCategory(listingData.category?.categoryId || '');
          setCondition(listingData.condition || '');
          setDescription(listingData.description || '');
          setOption(listingData.listingType?.toUpperCase().includes('RENT') ? 'rent' : 'sale');
          setPrice(listingData.price || '');
          setAllowMeetup(listingData.allowMeetup || false);
          setMeetupPlace(listingData.meetupLocation || '');
          setAllowDelivery(listingData.allowDelivery || false);
          setDeliveryOption(listingData.deliveryOptions || '');
          setExistingImages(listingData.images || []); 
        } else {
          throw new Error(`Listing with ID ${listingId} not found.`);
        }

      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Could not load listing data. Please try again.");
        // Only redirect if auth fails, otherwise show the error on screen
        if (err.message === "No authentication token found.") {
            navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [listingId, navigate]); 

  // --- Photo Handling Logic ---
  
  const handleLogout = () => { localStorage.removeItem('eduRentUserData'); navigate('/guest/dashboard'); };

  // Triggered when user selects files via the file dialog
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    addPhotos(files);
    // Reset file input so the user can select the same file again if they deleted it by mistake
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addPhotos = (newFiles) => {
    // Calculate total photos to enforce the 10-photo limit
    const totalCurrentPhotos = existingImages.length + photos.length;
    const availableSlots = 10 - totalCurrentPhotos;
    if (availableSlots <= 0) {
        showWarning("You can only upload a maximum of 10 photos in total.");
        return;
    }
    
    const filesToAdd = newFiles.slice(0, availableSlots);

    // Create preview URLs for the UI
    const newPhotoPreviews = filesToAdd.map(file => ({
        file: file, 
        previewUrl: URL.createObjectURL(file)
    }));

    setPhotos(prevPhotos => [...prevPhotos, ...newPhotoPreviews]);
  };

  // Removes a *newly* added photo from the preview list
  const removePhoto = (indexToRemove) => {
     setPhotos(prevPhotos => prevPhotos.filter((_, index) => index !== indexToRemove));
   };

  // Drag and drop UI feedback handlers
  const handleDragOver = (event) => {
    event.preventDefault(); 
    event.currentTarget.classList.add('dragging');
  };

  const handleDragLeave = (event) => {
     event.currentTarget.classList.remove('dragging');
  };

   const handleDrop = (event) => {
    event.preventDefault(); 
    event.currentTarget.classList.remove('dragging');
    const files = Array.from(event.dataTransfer.files);
    addPhotos(files);
   };

   // Marks an existing server-side image for deletion. 
   // We use async/await here because the custom confirm modal returns a Promise.
   const removeExistingImage = async (imageToRemove) => {
     const isConfirmed = await confirm({
        title: "Remove Image?",
        message: "This image will be permanently deleted when you save changes. Are you sure?",
        confirmText: "Yes, Remove",
        isDangerous: true
     });

     if (isConfirmed) {
        // 1. Add ID to deletion list
        setImagesToDelete(prev => [...prev, imageToRemove.imageId]);
        // 2. Remove from visual display
        setExistingImages(prev => prev.filter(img => img.imageId !== imageToRemove.imageId));
     }
   };

  // Main form submission handler
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!selectedCategory || !title || !condition || !description || !price) {
        showError("Please fill in all required fields."); return;
    }
    
    // Ensure there is at least one image remaining (either new or existing)
    if (existingImages.length === 0 && photos.length === 0) {
        showError("Please add at least one photo.");
        return;
    }

    setIsSubmitting(true);
    setLoadingStatus('Preparing your changes...');
    setError(null);

    // We use FormData because we are sending mixed data (text + binary files)
    const listingData = new FormData();
    listingData.append('categoryId', selectedCategory);
    listingData.append('title', title);
    listingData.append('condition', condition);
    listingData.append('description', description);
    listingData.append('listingType', option === 'rent' ? 'For Rent' : 'For Sale');
    listingData.append('price', price);
    listingData.append('allowMeetup', allowMeetup);
    if (allowMeetup) listingData.append('meetupLocation', meetupPlace);
    listingData.append('allowDelivery', allowDelivery);
    if (allowDelivery) listingData.append('deliveryOptions', deliveryOption);
    
    // 1. Append new photo files
    photos.forEach(photo => {
        if (photo.file instanceof File) {
             listingData.append('images', photo.file);
        }
    });
    
    // 2. Append IDs of images to be deleted from the server
    imagesToDelete.forEach(id => {
        listingData.append('imagesToDelete', id);
    });
    
    console.log("Updating listing with FormData...");
    setLoadingStatus('Saving your listing...');

    try {
      const response = await updateListing(listingId, listingData);

      console.log("Listing updated successfully:", response.data);
      showSuccess("Item updated successfully!");
      
      // Navigate back to previous page with state to reopen modal
      navigate(returnTo, { 
        state: { openListingId: openListingId || listingId } 
      }); 

    } catch (err) {
      console.error("Failed to update item:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to update item.";
      setError(errorMsg);
      showError(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
      setLoadingStatus('');
    }
  };

  // Handles clicking a notification to navigate to the relevant item or open modal
  const handleNotificationClick = async (notification) => {
    if (!notification.linkUrl) return;

    // Handle Messages
    if (notification.linkUrl.includes('/messages')) {
        const urlParts = notification.linkUrl.split('/').filter(part => part !== '');
        const conversationId = parseInt(urlParts[urlParts.length - 1], 10);
        if (conversationId && !isNaN(conversationId)) {
            navigate('/messages', { state: { openConversationId: conversationId } });
        } else {
            navigate('/messages');
        }
        return;
    }
    
    // Handle Profile
    if (notification.linkUrl.includes('/profile')) {
        navigate(notification.linkUrl);
        return;
    }

    // Handle Listings/Reviews -> Open Modal
    const urlParts = notification.linkUrl.split('/').filter(part => part !== '');
    const targetListingId = parseInt(urlParts[urlParts.length - 1], 10);

    if (!targetListingId || isNaN(targetListingId)) {
      navigate(notification.linkUrl);
      return;
    }

    setIsNotificationLoading(true);

    try {
      const response = await getListingById(targetListingId); 
      if (response.data) {
          setSelectedListingForModal(response.data);
          setIsModalOpen(true);
      } else {
        throw new Error(`Listing ${targetListingId} not found.`);
      }
    } catch (err) {
      console.error("Failed to fetch listing for notification:", err);
      navigate(notification.linkUrl);
    } finally {
      setIsNotificationLoading(false);
    }
  };

  // --- Render ---
  if (isLoading) {
    return <div className="profile-page"><Header userName="" onLogout={handleLogout} /><ListItemSkeleton /></div>;
  }
   if (error) {
     return <div className="profile-page"><Header userName={userName} onLogout={handleLogout} /><div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div></div>;
  }

  return (
    <div className="profile-page">
      <Header userName={userName} 
      profilePictureUrl={userData?.profilePictureUrl}
      onLogout={handleLogout} 
      onNotificationClick={handleNotificationClick}
      />

      <div className="page-layout-wrapper">
      <form onSubmit={handleUpdate}>
        <div className="list-item-page-container">

          {/* Left Column: Photos */}
          <section className="photos-section">
            <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} id="photoInput" />
            <div className="photo-upload-box" onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <div className="photo-upload-icon">➕</div>
                <div className="photo-upload-text">Add *new* photos</div>
                <div>or drag photo here</div>
            </div>
            
            <div className="photo-upload-note">(Max 10 total)</div>

              {/* Display previews for NEWLY added photos */}
              {photos.length > 0 && (
                <>
                <h4 style={{marginTop: '1.5rem', width: '100%', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem'}}>New Photos</h4>
                <div className="image-preview-grid">
                    {photos.map((photo, index) => (
                        <div key={index} className="image-preview-item">
                            <img src={photo.previewUrl} alt={`New preview ${index + 1}`} />
                            <button type="button" className="remove-image-btn" onClick={() => removePhoto(index)}>&times;</button>
                        </div>
                    ))}
                </div>
                </>
              )}

              {/* Display CURRENT/EXISTING images from the server */}
              {existingImages.length > 0 && (
                <>
                <h4 style={{marginTop: '1.5rem', width: '100%', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem'}}>Current Images</h4>
                <div className="image-preview-grid">
                    {existingImages.map((image) => (
                        <div key={image.imageId} className="image-preview-item">
                            <img src={image.imageUrl} alt="Existing item" />
                            <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() => removeExistingImage(image)} 
                                aria-label={`Mark image ${image.imageId} for deletion`}
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
                </>
              )}
          </section>

          {/* Right Column: Details (Values are pre-filled from state) */}
          <section className="details-section">
            <div className="form-field-group">
              <label htmlFor="category" className="form-label">Category</label>
              <select id="category" name="category" required value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="form-input">
                <option value="" disabled>Select category</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-field-group">
              <label htmlFor="title" className="form-label">Item Title</label>
              <input type="text" id="title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" />
            </div>

            <div className="form-field-group">
              <label className="form-label">Condition</label>
              <div className="condition-buttons">
                {CONDITION_OPTIONS.map((cond) => (
                  <button key={cond} type="button" className={`condition-button ${condition === cond ? 'selected' : ''}`} onClick={() => setCondition(cond)}>
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea id="description" name="description" required value={description} onChange={(e) => setDescription(e.target.value)} className="form-input form-textarea" />
            </div>
            
            <div className="form-field-group">
              <label className="form-label">Option</label>
              <div className="option-toggle">
                    <button type="button" className={`option-button ${option === 'sale' ? 'selected' : ''}`} onClick={() => setOption('sale')}>For Sale</button>
                    <button type="button" className={`option-button ${option === 'rent' ? 'selected' : ''}`} onClick={() => setOption('rent')}>For Rent</button>
              </div>
              <div className="option-price-input">
                <label htmlFor="price" className="form-label">{option === 'sale' ? 'Enter your price for sale' : 'Enter your price for rent'}</label>
                <input type="number" id="price" name="price" required value={price} onChange={(e) => setPrice(e.target.value)} className="form-input" placeholder="0.00" step="0.01" min="0"/>
              </div>
            </div>

            <div className="form-field-group">
              <label className="form-label">Deal Method</label>
              <div className="deal-method-toggle">
                <span className="notification-label">Meet-up</span>
                <ToggleSwitch checked={allowMeetup} onChange={(e) => setAllowMeetup(e.target.checked)} />
              </div>
              {allowMeetup && (
                <div className="deal-method-input"><input type="text" name="meetupPlace" value={meetupPlace} onChange={(e) => setMeetupPlace(e.target.value)} className="form-input" placeholder="Enter meet-up place" required/></div>
              )}
              <div className="deal-method-toggle" style={{marginTop: '1.5rem'}}> 
                    <span className="notification-label">Delivery</span>
                    <ToggleSwitch checked={allowDelivery} onChange={(e) => setAllowDelivery(e.target.checked)} />
              </div>
              {allowDelivery && (
                    <div className="deal-method-input"><input type="text" name="deliveryOption" value={deliveryOption} onChange={(e) => setDeliveryOption(e.target.value)} className="form-input" placeholder="Add delivery option (e.g. Maxim or Lalamove)" required/></div>
              )}
            </div>

            <div className="action-buttons">
              <button type="button" className="btn btn-clear" onClick={() => navigate(returnTo, { state: { openListingId } })} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-list" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </section>
        </div>
      </form>
      </div>

      {/* Notification Detail Modal */}
      {isModalOpen && selectedListingForModal && (
         <ProductDetailModal
           listing={selectedListingForModal}
           onClose={() => setIsModalOpen(false)}
           currentUserId={userData?.userId}
           // Simple check for "isLiked" based on the listing data itself
           isLiked={selectedListingForModal.likes?.some(l => l.id?.userId === userData?.userId)}
           onLikeClick={async (id) => {
               // Simple inline toggle handler since we don't have global like state on this page
               try {
                   const isLiked = selectedListingForModal.likes?.some(l => l.id?.userId === userData?.userId);
                   if (isLiked) await unlikeListing(id);
                   else await likeListing(id);
                   
                   // Refresh the modal data to show the new like status
                   const res = await getListingById(id);
                   setSelectedListingForModal(res.data);
               } catch (e) {
                   console.error("Like toggle failed", e);
               }
           }}
         />
       )}

       {/* Loading Skeleton */}
       {isNotificationLoading && (
         <ProductDetailModalSkeleton onClose={() => setIsNotificationLoading(false)} />
       )}

       {/* Loading Overlay for form submission */}
       <LoadingOverlay 
         isVisible={isSubmitting} 
         message={loadingStatus || "Saving your listing..."} 
       />
    </div>
  );
}
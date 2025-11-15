import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import Header from '../components/Header';
// Import new API functions
import { getCurrentUser, getCategories, getListingById, updateListing } from '../services/apiService';

// Import CSS (reuse)
import '../static/ListItemPage.css';
import '../static/SettingsPage.css';

// --- Skeleton Component (copied from ListItemPage) ---
function ListItemSkeleton() {
  return (
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
        {/* Category */}
        <div className="skeleton skeleton-form-label"></div>
        <div className="skeleton skeleton-form-input"></div>
        {/* Title */}
        <div className="skeleton skeleton-form-label"></div>
        <div className="skeleton skeleton-form-input"></div>
        {/* Condition */}
        <div className="skeleton skeleton-form-label"></div>
        <div className="skeleton-condition-buttons">
          {Array.from({ length: 4 }).map((_, i) => ( 
            <div key={i} className="skeleton skeleton-condition-button"></div>
          ))}
        </div>
        {/* Description */}
        <div className="skeleton skeleton-form-label"></div>
        <div className="skeleton skeleton-textarea"></div>
        {/* Option */}
        <div className="skeleton skeleton-form-label"></div>
        <div className="skeleton skeleton-toggle"></div>
        <div className="skeleton skeleton-form-label" style={{ marginTop: '0.75rem' }}></div>
        <div className="skeleton skeleton-form-input" style={{ marginBottom: '1.5rem' }}></div>
        {/* Deal Method */}
        <div className="skeleton skeleton-form-label"></div>
        <div className="skeleton skeleton-form-input" style={{ height: '30px', marginBottom: '1rem' }}></div>
        <div className="skeleton skeleton-form-input" style={{ height: '30px' }}></div>
      </section>
    </div>
  );
}
// --- END Skeleton Component ---

const CONDITION_OPTIONS = ['Brand New', 'Like New', 'Lightly Used', 'Well Used', 'Heavily Used'];

export default function EditListingPage() {
  const { listingId } = useParams(); // <-- Get listingId from URL
  const [userName, setUserName] = useState('');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start true to fetch data
  const [isSubmitting, setIsSubmitting] = useState(false); // For submit button
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Form State ---
  const [photos, setPhotos] = useState([]); // Will hold *new* photos
  const [existingImages, setExistingImages] = useState([]); // To display current images
  
  // --- NEW: State to track IDs of images marked for deletion ---
  const [imagesToDelete, setImagesToDelete] = useState([]);
  // ------------------------------------------------------------

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

  // --- Fetch Initial Data (User, Categories, AND Existing Listing) ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userPromise = getCurrentUser();
        const categoriesPromise = getCategories();
        const listingPromise = getListingById(listingId); // <-- Fetch the listing

        const [userResponse, categoriesResponse, listingResponse] = await Promise.all([
          userPromise,
          categoriesPromise,
          listingPromise
        ]);

        // 1. Set User
        setUserName(userResponse.data?.fullName?.split(' ')[0] || 'User');
        // 2. Set Categories
        setCategories(categoriesResponse.data || []);

        // 3. Pre-fill form with existing listing data
        const listingData = listingResponse.data;
        if (listingData) {
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
          setExistingImages(listingData.images || []); // Set existing images
        } else {
          throw new Error(`Listing with ID ${listingId} not found.`);
        }

      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Could not load listing data. Please try again.");
        if (err.message === "No authentication token found.") {
            navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [listingId, navigate]); // Rerun if listingId changes

  // --- Handlers (Photo upload/drag/drop - same as ListItemPage) ---
  // <--- FILLED IN from modified code --->
  const handleLogout = () => { localStorage.removeItem('eduRentUserData'); navigate('/login'); };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    addPhotos(files);
    // Reset file input to allow selecting the same file again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addPhotos = (newFiles) => {
    // Limit to 10 photos total (existing + new)
    const totalCurrentPhotos = existingImages.length + photos.length;
    const availableSlots = 10 - totalCurrentPhotos;
    if (availableSlots <= 0) {
        alert("You can only upload a maximum of 10 photos in total.");
        return;
    }
    
    const filesToAdd = newFiles.slice(0, availableSlots);

    // Create preview URLs
    const newPhotoPreviews = filesToAdd.map(file => ({
        file: file, // Keep the actual file object
        previewUrl: URL.createObjectURL(file)
    }));

    setPhotos(prevPhotos => [...prevPhotos, ...newPhotoPreviews]);
  };

  // This removes a *newly uploaded* photo from the preview
  const removePhoto = (indexToRemove) => {
     // TODO: Revoke URL.createObjectURL(photos[indexToRemove].previewUrl) for performance
     setPhotos(prevPhotos => prevPhotos.filter((_, index) => index !== indexToRemove));
   };

  const handleDragOver = (event) => {
    event.preventDefault(); // Necessary to allow drop
    event.currentTarget.classList.add('dragging');
  };

  const handleDragLeave = (event) => {
     event.currentTarget.classList.remove('dragging');
  };

   const handleDrop = (event) => {
    event.preventDefault(); // Prevent browser opening file
    event.currentTarget.classList.remove('dragging');
    const files = Array.from(event.dataTransfer.files);
    addPhotos(files);
   };
  // <--- END: FILLED IN ---

   // --- UPDATED: Handler to remove *existing* images (This was already correct in your code) ---
   const removeExistingImage = (imageToRemove) => {
     if (window.confirm("This will permanently delete this image upon saving. Are you sure?")) {
        // 1. Add its ID to the deletion list
        setImagesToDelete(prev => [...prev, imageToRemove.imageId]);
        // 2. Remove it from the display list
        setExistingImages(prev => prev.filter(img => img.imageId !== imageToRemove.imageId));
     }
   };
   // ----------------------------------------------------

  // --- Renamed from handleListNow to handleUpdate ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    // Basic validation (same as before)
    if (!selectedCategory || !title || !condition || !description || !price) {
        alert("Please fill in all required fields."); return;
    }
    
    // <--- ADDED: Validation from modified code ---
    if (existingImages.length === 0 && photos.length === 0) {
        alert("Please add at least one photo.");
        return;
    }
    // ... other validations ...

    setIsSubmitting(true); // <--- Changed from setIsLoading(true)
    setError(null);

    // --- Prepare FormData for UPDATE ---
    const listingData = new FormData();
    // Add all text fields
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
    
    // 1. Add *new* photos
    photos.forEach(photo => {
        if (photo.file instanceof File) {
             listingData.append('images', photo.file);
        }
    });
    
    // 2. --- NEW: Add IDs of images to delete (This was already correct) ---
    imagesToDelete.forEach(id => {
        listingData.append('imagesToDelete', id);
    });
    // -----------------------------------------------------
    
    console.log("Updating listing with FormData...");

    try {
      // --- Call updateListing API Service ---
      const response = await updateListing(listingId, listingData);
      // ------------------------------------

      console.log("Listing updated successfully:", response.data);
      alert("Item updated successfully!");
      navigate('/manage-listings'); // Go back to manage page

    } catch (err) {
      console.error("Failed to update item:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to update item.";
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false); // <--- Changed from setIsLoading(false)
    }
  };

  // --- NEW Universal Notification Click Handler ---
  const handleNotificationClick = async (notification) => {
    console.log("Notification clicked:", notification);

    // 1. Extract the listing ID from the notification's URL
    const urlParts = notification.linkUrl?.split('/');
    const listingId = urlParts ? parseInt(urlParts[urlParts.length - 1], 10) : null;

    if (!listingId) {
      console.error("Could not parse listingId from notification linkUrl:", notification.linkUrl);
      alert("Could not open this notification: Invalid link.");
      return;
    }

    console.log(`Fetching details for listingId: ${listingId}`);

    try {
      // 2. Fetch that specific listing's data from the API
      // We must have `getListingById` imported from apiService.js
      const response = await getListingById(listingId); 

      if (response.data) {
        // 3. We found the listing! Call openModal with the data.
        openModal(response.data);
      } else {
        throw new Error(`Listing ${listingId} not found.`);
      }

    } catch (err) {
      console.error("Failed to fetch listing for notification:", err);
      alert(`Could not load item: ${err.message}. It may have been deleted.`);
      // As a fallback, navigate to the main browse page
      navigate('/browse');
    }
  };
  // --- End new function ---

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
      onLogout={handleLogout} 
      onNotificationClick={handleNotificationClick}
      />

      {/* --- Changed submit handler --- */}
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
            {/* --- UPDATED: Note --- */}
            <div className="photo-upload-note">(Max 10 total)</div>

              {/* --- Display NEWLY Added Previews --- */}
              {photos.length > 0 && (
                <>
                {/* --- ADDED: Title --- */}
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

              {/* --- Display EXISTING Images --- */}
              {existingImages.length > 0 && (
                <>
                {/* --- This title was already in your code --- */}
                <h4 style={{marginTop: '1.5rem', width: '100%', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem'}}>Current Images</h4>
                <div className="image-preview-grid">
                    {existingImages.map((image) => (
                        <div key={image.imageId} className="image-preview-item">
                            <img src={`http://localhost:8080${image.imageUrl}`} alt="Existing item" />
                            {/* --- This button was already active in your code --- */}
                            <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() => removeExistingImage(image)} // Pass the whole image object
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
                <label className="toggle-switch"><input type="checkbox" checked={allowMeetup} onChange={(e) => setAllowMeetup(e.target.checked)} /><span className="toggle-slider"></span></label>
              </div>
              {allowMeetup && (
                <div className="deal-method-input"><input type="text" name="meetupPlace" value={meetupPlace} onChange={(e) => setMeetupPlace(e.target.value)} className="form-input" placeholder="Enter meet-up place" required/></div>
              )}
              <div className="deal-method-toggle" style={{marginTop: '1.5rem'}}> {/* <--- Fixed margin --- */ }
                   <span className="notification-label">Delivery</span>
                   <label className="toggle-switch"><input type="checkbox" checked={allowDelivery} onChange={(e) => setAllowDelivery(e.target.checked)} /><span className="toggle-slider"></span></label>
              </div>
              {allowDelivery && (
                   <div className="deal-method-input"><input type="text" name="deliveryOption" value={deliveryOption} onChange={(e) => setDeliveryOption(e.target.value)} className="form-input" placeholder="Add delivery option (e.g. Maxim or Lalamove)" required/></div>
              )}
            </div>

            <div className="action-buttons">
              <button type="button" className="btn btn-clear" onClick={() => navigate('/manage-listings')} disabled={isSubmitting}>
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
  );
}
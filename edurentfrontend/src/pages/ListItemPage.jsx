import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Import Hooks ---
import useAuth from '../hooks/useAuth';
import usePageLogic from '../hooks/usePageLogic';

// --- Import Components ---
import Header from '../components/Header';
// ProductDetailModal and Skeleton are now handled by usePageLogic

// --- Import API Functions ---
import { 
  getCategories, 
  getSchools, 
  createListing 
} from '../services/apiService';

// Import CSS
import '../static/ListItemPage.css';
import '../static/SettingsPage.css';  // For toggle styles

// --- Page-Specific Skeleton Component ---
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
  );
}

const CONDITION_OPTIONS = ['Brand New', 'Like New', 'Lightly Used', 'Well Used', 'Heavily Used'];

export default function ListItemPage() {
  
  // --- 1. Use Hooks ---
  // Gets user data, auth status, and logout function.
  const { userData, userName, isLoadingAuth, authError, logout } = useAuth();
  
  // Gets modal component and notification click handler.
  // We pass 'null' for likesHook since this page doesn't need it,
  // but usePageLogic can still handle notifications.
  const { 
    handleNotificationClick, 
    ModalComponent
  } = usePageLogic(userData, null);
  // --------------------

  // --- 2. Local Page State ---
  // This state is for data needed to populate the form.
  const [categories, setCategories] = useState([]);
  const [schools, setSchools] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true); // Loading for categories/schools
  const [error, setError] = useState(null); // Page-specific errors (e.g., submission fail)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // --- 3. Form-Specific State ---
  // This state manages the form inputs.
  const [photos, setPhotos] = useState([]); 
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
  
  // --- 4. Fetch Initial Form Data ---
  // Runs once the user is authenticated.
  useEffect(() => {
    if (userData) { 
      const fetchData = async () => {
        setIsLoadingData(true);
        setError(null);
        try {
          // Fetch data needed to populate the form dropdowns
          const categoriesPromise = getCategories();
          const schoolsPromise = getSchools(); 

          const [categoriesResponse, schoolsResponse] = await Promise.all([
            categoriesPromise,
            schoolsPromise
          ]);

          setCategories(categoriesResponse.data || []);
          setSchools(schoolsResponse.data || []);

        } catch (err) {
          console.error("Failed to fetch initial data:", err);
          setError("Could not load page data. Please try again.");
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    }
  }, [userData]); // Re-run if userData becomes available

  // --- 5. Form Handlers ---

  // Triggers the hidden file input
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    addPhotos(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Adds new files to the photos state with previews
  const addPhotos = (newFiles) => {
    const availableSlots = 10 - photos.length;
    const filesToAdd = newFiles.slice(0, availableSlots);
    const newPhotoPreviews = filesToAdd.map(file => ({
        file: file, 
        previewUrl: URL.createObjectURL(file)
    }));
    setPhotos(prevPhotos => [...prevPhotos, ...newPhotoPreviews]);
  };

  // Removes a photo from the preview list
  const removePhoto = (indexToRemove) => {
    // TODO: Revoke object URL to prevent memory leaks
    // URL.revokeObjectURL(photos[indexToRemove].previewUrl);
    setPhotos(prevPhotos => prevPhotos.filter((_, index) => index !== indexToRemove));
  };

  // Drag-and-drop photo handlers
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

  // Resets the entire form to its default state
  const handleClearDetails = () => {
    setPhotos([]);
    setSelectedCategory('');
    setTitle('');
    setCondition('');
    setDescription('');
    setOption('sale');
    setPrice('');
    setAllowMeetup(false);
    setMeetupPlace('');
    setAllowDelivery(false);
    setDeliveryOption('');
    // TODO: Revoke all object URLs
  };

  // Handles the final form submission
  const handleListNow = async (e) => { 
    e.preventDefault();
    
    // --- Validation ---
    if (photos.length === 0 || !selectedCategory || !title || !condition || !description || !price) {
        alert("Please fill in all required fields and add at least one photo.");
        return;
    }
    if (allowMeetup && !meetupPlace.trim()) {
      alert("Please enter a meet-up place.");
      return;
    }
    if (allowDelivery && !deliveryOption.trim()) {
      alert("Please add a delivery option.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    // --- Prepare FormData ---
    const listingData = new FormData();
    photos.forEach(photo => {
        if (photo.file instanceof File) {
             listingData.append('images', photo.file);
        } else {
             console.warn("Skipping invalid photo data:", photo);
        }
    });
    listingData.append('categoryId', selectedCategory);
    listingData.append('title', title);
    // 'schoolId' is no longer needed; backend gets it from the user token.
    listingData.append('condition', condition);
    listingData.append('description', description);
    listingData.append('listingType', option === 'rent' ? 'For Rent' : 'For Sale');
    listingData.append('price', price);
    listingData.append('allowMeetup', allowMeetup);
    if (allowMeetup) listingData.append('meetupLocation', meetupPlace);
    listingData.append('allowDelivery', allowDelivery);
    if (allowDelivery) listingData.append('deliveryOptions', deliveryOption);
    
    console.log("Submitting FormData..."); 
    
    try {
      // --- Call API Service ---
      const response = await createListing(listingData);
      console.log("Listing created successfully:", response.data);
      alert("Item listed successfully!"); 
      handleClearDetails(); // Clear the form
      navigate('/profile'); // Navigate after success

    } catch (err) {
      console.error("Failed to list item:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to list item.";
      setError(errorMsg); 
      alert(`Error: ${errorMsg}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 6. Render Logic ---
  
  // Combine loading states from auth and local data fetching
  const isPageLoading = isLoadingAuth || isLoadingData;
  // Combine error states from auth and local page errors
  const pageError = authError || error;

  if (isPageLoading) {
    return (
        <div className="profile-page"> 
            <Header userName="" onLogout={logout} />
            <div className="list-item-page-container skeleton"> 
                <ListItemSkeleton />
            </div>
        </div>
      );
  }
  
   if (pageError) {
     return (
       <div className="profile-page">
         <Header userName={userName} onLogout={logout} />
         <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>
           Error: {pageError}
           {/* You can add a retry button here if needed */}
         </div>
       </div>
     );
  }

  // --- Main Page Render ---
  return (
    <div className="profile-page"> 
      <Header 
        userName={userName}                 // From useAuth
        profilePictureUrl={userData?.profilePictureUrl}
        onLogout={logout}                 // From useAuth
        onNotificationClick={handleNotificationClick} // From usePageLogic
      />

      <form onSubmit={handleListNow}>
        <div className="list-item-page-container">

          {/* Left Column: Photos */}
          <section className="photos-section">
            <input
              type="file"
              multiple 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }} 
              id="photoInput"
            />
            <div
              className="photo-upload-box"
              onClick={() => fileInputRef.current?.click()} 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="photo-upload-icon">➕</div>
              <div className="photo-upload-text">Add photo</div>
              <div>or drag photo here</div>
            </div>
            <div className="photo-upload-note">(Up to 10 photos)</div>

            {/* Image Previews */}
            {photos.length > 0 && (
              <div className="image-preview-grid">
                  {photos.map((photo, index) => (
                      <div key={index} className="image-preview-item">
                          <img src={photo.previewUrl} alt={`Preview ${index + 1}`} />
                          <button
                            type="button" 
                            className="remove-image-btn"
                            onClick={() => removePhoto(index)}
                            aria-label={`Remove image ${index + 1}`}
                          >
                            &times;
                          </button>
                      </div>
                  ))}
              </div>
            )}
          </section>

          {/* Right Column: Details */}
          <section className="details-section">
            {/* Category */}
            <div className="form-field-group">
              <label htmlFor="category" className="form-label">Category</label>
              <select
                id="category" name="category" required value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-input"
              >
                <option value="" disabled>Select category</option>
                {/* Use 'categories' state from API */}
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Item Title */}
            <div className="form-field-group">
              <label htmlFor="title" className="form-label">Item Title</label>
              <input
                type="text" id="title" name="title" required value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input" placeholder="e.g., Introduction to Calculus Textbook"
              />
            </div>

            {/* School field is removed, as it's handled by the backend */}

            {/* Condition */}
            <div className="form-field-group">
              <label className="form-label">Condition</label>
              <div className="condition-buttons">
                {CONDITION_OPTIONS.map((cond) => (
                  <button
                    key={cond} type="button"
                    className={`condition-button ${condition === cond ? 'selected' : ''}`}
                    onClick={() => setCondition(cond)}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="form-field-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description" name="description" required value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input form-textarea" placeholder="Describe your item..."
              />
            </div>

            {/* Option (Sale/Rent) */}
            <div className="form-field-group">
              <label className="form-label">Option</label>
              <div className="option-toggle">
                <button
                  type="button"
                  className={`option-button ${option === 'sale' ? 'selected' : ''}`}
                  onClick={() => { setOption('sale'); setPrice(''); }} 
                >
                  For Sale
                </button>
                <button
                  type="button"
                  className={`option-button ${option === 'rent' ? 'selected' : ''}`}
                  onClick={() => { setOption('rent'); setPrice(''); }} 
                >
                  For Rent
                </button>
              </div>
              <div className="option-price-input">
                <label htmlFor="price" className="form-label">
                  {option === 'sale' ? 'Enter your price for sale' : 'Enter your price for rent'}
                </label>
                <input
                  type="number" id="price" name="price" required value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="form-input" placeholder="0.00"
                  step="0.01" min="0" 
                />
              </div>
            </div>

            {/* Deal Method */}
            <div className="form-field-group">
              <label className="form-label">Deal Method</label>
              {/* Meet-up */}
              <div className="deal-method-toggle">
                <span className="notification-label">Meet-up</span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={allowMeetup} onChange={(e) => setAllowMeetup(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {allowMeetup && (
                <div className="deal-method-input">
                  <input
                    type="text" name="meetupPlace" value={meetupPlace}
                    onChange={(e) => setMeetupPlace(e.target.value)}
                    className="form-input" placeholder="Enter meet-up place" required
                  />
                </div>
              )}
              {/* Delivery */}
              <div className="deal-method-toggle" style={{marginTop: '1rem'}}>
                 <span className="notification-label">Delivery</span>
                 <label className="toggle-switch">
                   <input type="checkbox" checked={allowDelivery} onChange={(e) => setAllowDelivery(e.target.checked)} />
                   <span className="toggle-slider"></span>
                 </label>
              </div>
              {allowDelivery && (
                 <div className="deal-method-input">
                   <input
                     type="text" name="deliveryOption" value={deliveryOption}
                     onChange={(e) => setDeliveryOption(e.target.value)}
                     className="form-input" placeholder="Add delivery option (e.g. Maxim or Lalamove)" required
                   />
                 </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                type="button" 
                className="btn btn-clear" 
                onClick={handleClearDetails} 
                disabled={isSubmitting} 
              >
                Clear Details
              </button>
              <button 
                type="submit" 
                className="btn btn-list" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Listing...' : 'List Now'}
              </button>
            </div>

          </section>
        </div>
      </form>
      
      {/* This renders the modal. It will only appear if 
        usePageLogic's 'openModal' function is called (e.g., by a notification).
      */}
      <ModalComponent />
      
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';

// Custom hooks for auth and global UI logic
import useAuth from '../hooks/useAuth';
import usePageLogic from '../hooks/usePageLogic';

// New Feedback Hook
import { useToast } from '../context/ToastContext';
import imageCompression from 'browser-image-compression';

// Components
import Header from '../components/Header';
import LoadingOverlay from '../components/LoadingOverlay';

// API services
import { 
  getCategories, 
  getSchools, 
  createListing 
} from '../services/apiService';

// Styles
import '../static/ListItemPage.css';
import '../static/SettingsPage.css';

// A placeholder component to display while the form data is loading
function ListItemSkeleton() {
  return (
    <div className="skeleton-list-item-container">
      {/* Left Column: Photo placeholders */}
      <section className="skeleton-photos-section">
        <div className="skeleton skeleton-photo-upload-box"></div>
        <div className="skeleton skeleton-photo-note"></div>
        <div className="skeleton-preview-grid">
          {Array.from({ length: 3 }).map((_, i) => ( 
            <div key={i} className="skeleton skeleton-preview-item"></div>
          ))}
        </div>
      </section>

      {/* Right Column: Input placeholders */}
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
  
  // Get the current user session
  const { userData, userName, isLoadingAuth, authError, logout } = useAuth();
  
  // Initialize notification handling
  const { 
    handleNotificationClick: baseHandleNotificationClick, 
    ModalComponent
  } = usePageLogic(userData, null);

  // Initialize feedback tools
  const { showSuccess, showError, showWarning } = useToast();

  // Local state for dropdown data
  const [categories, setCategories] = useState([]);
  // const [schools, setSchools] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [error, setError] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(''); // Dynamic status message
  // const navigate = useNavigate();

  // Form input state
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
  
  // Ref to programmatically click the hidden file input
  const fileInputRef = useRef(null); 
  
  // Load categories and schools when the user logs in
  useEffect(() => {
    if (userData) { 
      const fetchData = async () => {
        setIsLoadingData(true);
        setError(null);
        try {
          const categoriesPromise = getCategories();
          const schoolsPromise = getSchools(); 

          const [categoriesResponse] = await Promise.all([
            categoriesPromise,
            schoolsPromise
          ]);

          setCategories(categoriesResponse.data || []);
          // setSchools(schoolsResponse.data || []);

        } catch (err) {
          console.error("Failed to fetch initial data:", err);
          setError("Could not load page data. Please try again.");
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    }
  }, [userData]); 

  // CLEANUP: Revoke object URLs to avoid memory leaks when component unmounts
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if (photo.previewUrl) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
    };
  }, [photos]);

  // --- Photo Handling ---

  // Triggered when files are selected via the dialog
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    addPhotos(files);
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Convert files to preview URLs and add them to state
  const addPhotos = (newFiles) => {
    const availableSlots = 10 - photos.length;
    
    // Provide feedback if user tries to exceed the limit
    if (availableSlots <= 0) {
        showWarning("You've reached the 10-photo limit.");
        return;
    }

    const filesToAdd = newFiles.slice(0, availableSlots);
    
    // Create local object URLs for immediate preview
    const newPhotoPreviews = filesToAdd.map(file => ({
        file: file, 
        previewUrl: URL.createObjectURL(file)
    }));
    setPhotos(prevPhotos => [...prevPhotos, ...newPhotoPreviews]);
  };

  // Remove a photo from the list
  const removePhoto = (indexToRemove) => {
    setPhotos(prevPhotos => {
      const targetPhoto = prevPhotos[indexToRemove];
      if (targetPhoto && targetPhoto.previewUrl) {
        // Free up memory immediately
        URL.revokeObjectURL(targetPhoto.previewUrl);
      }
      return prevPhotos.filter((_, index) => index !== indexToRemove);
    });
  };

  // UI feedback for drag-and-drop interactions
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

  // Helper to reset the form fields
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
  };

  // Submit the listing to the backend
  const handleListNow = async (e) => { 
    e.preventDefault();
    
    // Basic validation with user-friendly error messages
    if (photos.length === 0 || !selectedCategory || !title || !condition || !description || !price) {
        showError("Please fill in all required fields and add at least one photo.");
        return;
    }
    if (allowMeetup && !meetupPlace.trim()) {
      showError("Please enter a meet-up place.");
      return;
    }
    if (allowDelivery && !deliveryOption.trim()) {
      showError("Please add a delivery option.");
      return;
    }
    
    setIsSubmitting(true);
    setLoadingStatus('Optimizing images...');
    setError(null);

    // Optimized compression: Skip small images, use faster settings
    const compressedPhotos = await Promise.all(
        photos.map(async (photo) => {
            if (photo.file instanceof File) {
                // Skip compression if file is already small (under 800KB)
                const fileSizeKB = photo.file.size / 1024;
                if (fileSizeKB < 800) {
                    return photo.file;
                }
                
                const options = {
                    maxSizeMB: 1,              // Increased from 0.5MB for faster processing
                    maxWidthOrHeight: 1280,   // Reduced from 1920 - still good for web display
                    useWebWorker: true,
                    initialQuality: 0.8,       // Slightly higher quality, still fast
                    alwaysKeepResolution: false,
                };
                return await imageCompression(photo.file, options);
            }
            return photo.file;
        })
    );


    // We use FormData to handle file uploads alongside text data
    const listingData = new FormData();
    compressedPhotos.forEach(file => {
        listingData.append('images', file); // Append the SMALLER file
    });
    
    listingData.append('categoryId', selectedCategory);
    listingData.append('title', title);
    // Note: 'schoolId' is handled by the backend using the user's token
    listingData.append('condition', condition);
    listingData.append('description', description);
    listingData.append('listingType', option === 'rent' ? 'For Rent' : 'For Sale');
    listingData.append('price', price);
    listingData.append('allowMeetup', allowMeetup);
    
    if (allowMeetup) listingData.append('meetupLocation', meetupPlace);
    listingData.append('allowDelivery', allowDelivery);
    if (allowDelivery) listingData.append('deliveryOptions', deliveryOption);
    
    console.log("Submitting FormData...");
    setLoadingStatus('Creating your listing...');
    
    try {
      const response = await createListing(listingData);
      console.log("Listing created successfully:", response.data);
      
      showSuccess("Item listed successfully!");
      handleClearDetails(); 
      // Optimized: Stay on page to allow listing another item immediately
      // navigate('/profile'); 

    } catch (err) {
      console.error("Failed to list item:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to list item.";
      setError(errorMsg); 
      showError(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
      setLoadingStatus('');
    }
  };

  // Wrapper for notification clicks to handle errors gracefully
  const handleNotificationClick = (notification) => {
    try {
        baseHandleNotificationClick(notification);
    } catch (err) {
        // Log error but don't crash
        console.warn("Notification error", err);
        showError("Could not open notification.");
    }
  };

  // Combine loading states for a smooth UI experience
  const isPageLoading = isLoadingAuth || isLoadingData;
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
         </div>
       </div>
     );
  }

  return (
    <div className="profile-page"> 
      <Header 
        userName={userName}                 
        profilePictureUrl={userData?.profilePictureUrl}
        onLogout={logout}                 
        onNotificationClick={handleNotificationClick} 
      />

      <form onSubmit={handleListNow}>
        <div className="list-item-page-container">

          {/* Left Column: Photo Uploads */}
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

            {/* Photo Previews */}
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

          {/* Right Column: Item Details */}
          <section className="details-section">
            
            <div className="form-field-group">
              <label htmlFor="category" className="form-label">Category</label>
              <select
                id="category" name="category" required value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-input"
              >
                <option value="" disabled>Select category</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-field-group">
              <label htmlFor="title" className="form-label">Item Title</label>
              <input
                type="text" id="title" name="title" required value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input" placeholder="e.g., Introduction to Calculus Textbook"
              />
            </div>

            {/* Note: School selection is removed because it's inferred from the user's account */}

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

            <div className="form-field-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description" name="description" required value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input form-textarea" placeholder="Describe your item..."
              />
            </div>

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

            <div className="form-field-group">
              <label className="form-label">Deal Method</label>
              
              {/* Meet-up Toggle */}
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

              {/* Delivery Toggle */}
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
      
      {/* Loading overlay for form submission */}
      <LoadingOverlay 
        isVisible={isSubmitting} 
        message={loadingStatus || "Creating your listing..."} 
      />
      
      {/* Modal rendered by usePageLogic */}
      <ModalComponent />
      
    </div>
  );
}
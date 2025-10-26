import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
// --- UPDATED IMPORTS ---
import { 
  getCurrentUser, 
  getCategories, 
  getSchools, 
  createListing 
} from '../services/apiService';

// Import CSS
import '../static/ListItemPage.css';

// --- Skeleton Component (no changes) ---
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

// --- MOCK DATA REMOVED ---

const CONDITION_OPTIONS = ['Brand New', 'Like New', 'Lightly Used', 'Well Used', 'Heavily Used'];

export default function ListItemPage() {
  const [userName, setUserName] = useState('');
  const [categories, setCategories] = useState([]);
  const [schools, setSchools] = useState([]); // <-- State for schools
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Form State ---
  const [photos, setPhotos] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  // const [selectedSchool, setSelectedSchool] = useState(''); // <-- REMOVED
  const [condition, setCondition] = useState(''); 
  const [description, setDescription] = useState('');
  const [option, setOption] = useState('sale'); 
  const [price, setPrice] = useState('');
  const [allowMeetup, setAllowMeetup] = useState(false);
  const [meetupPlace, setMeetupPlace] = useState('');
  const [allowDelivery, setAllowDelivery] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('');
  const fileInputRef = useRef(null); 
  
  // --- NEW Submission State ---
  const [isSubmitting, setIsSubmitting] = useState(false);


  // --- Fetch Initial Data (UPDATED) ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch user, categories, and schools in parallel
        const userPromise = getCurrentUser();
        const categoriesPromise = getCategories();
        const schoolsPromise = getSchools(); // <-- Fetch schools

        const [userResponse, categoriesResponse, schoolsResponse] = await Promise.all([
          userPromise,
          categoriesPromise,
          schoolsPromise
        ]);

        setUserName(userResponse.data?.fullName?.split(' ')[0] || 'User');
        setCategories(categoriesResponse.data || []); // <-- Use API data
        setSchools(schoolsResponse.data || []); // <-- Use API data

      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Could not load page data. Please try again.");
        if (err.message === "No authentication token found." || err.response?.status === 401 || err.response?.status === 403) {
            navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // --- Handlers (Photo handlers, etc. no changes) ---
  const handleLogout = () => { localStorage.removeItem('eduRentUserData'); navigate('/login'); };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    addPhotos(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addPhotos = (newFiles) => {
    const availableSlots = 10 - photos.length;
    const filesToAdd = newFiles.slice(0, availableSlots);
    const newPhotoPreviews = filesToAdd.map(file => ({
        file: file, 
        previewUrl: URL.createObjectURL(file)
    }));
    setPhotos(prevPhotos => [...prevPhotos, ...newPhotoPreviews]);
  };

   const removePhoto = (indexToRemove) => {
     // TODO: Revoke object URL before removing
     // URL.revokeObjectURL(photos[indexToRemove].previewUrl);
     setPhotos(prevPhotos => prevPhotos.filter((_, index) => index !== indexToRemove));
   };

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


  const handleClearDetails = () => {
    setPhotos([]);
    setSelectedCategory('');
    setTitle('');
    // setSelectedSchool(''); // <-- REMOVED
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

  // --- NEW handleListNow Function ---
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
    // --- End Validation ---

    setIsSubmitting(true); // Indicate loading/submission
    setError(null); // Clear previous errors

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
    // listingData.append('schoolId', selectedSchool); // <-- REMOVED
    listingData.append('condition', condition);
    listingData.append('description', description);
    listingData.append('listingType', option === 'rent' ? 'For Rent' : 'For Sale');
    listingData.append('price', price);
    listingData.append('allowMeetup', allowMeetup);
    if (allowMeetup) listingData.append('meetupLocation', meetupPlace);
    listingData.append('allowDelivery', allowDelivery);
    if (allowDelivery) listingData.append('deliveryOptions', deliveryOption);
    // -------------------------

    console.log("Submitting FormData..."); 

    try {
      // --- Call API Service ---
      const response = await createListing(listingData);
      // ------------------------

      console.log("Listing created successfully:", response.data);
      alert("Item listed successfully!"); 
      handleClearDetails(); // Clear the form
      navigate('/dashboard'); // Navigate after success

    } catch (err) {
      console.error("Failed to list item:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to list item. Please check details and try again.";
      setError(errorMsg); 
      alert(`Error: ${errorMsg}`); 
    } finally {
      setIsSubmitting(false); // Stop loading indicator
    }
  };

  // --- Render ---
  if (isLoading) {
    return (
        <div className="profile-page"> 
            <Header userName="" onLogout={handleLogout} />
            <div className="list-item-page-container skeleton"> 
                <ListItemSkeleton />
            </div>
        </div>
      );
  }
   if (error) {
     return <div className="profile-page"><Header userName={userName} onLogout={handleLogout} /><div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div></div>;
  }

  return (
    <div className="profile-page"> 
      <Header userName={userName} onLogout={handleLogout} />

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

            {/* --- SCHOOL FIELD REMOVED --- */}

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

            {/* --- ACTION BUTTONS (UPDATED) --- */}
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
    </div>
  );
}
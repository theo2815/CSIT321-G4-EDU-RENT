import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getCurrentUser, getCategories } from '../services/apiService'; // Assuming getCategories exists

// Import CSS
import '../static/ListItemPage.css';

// --- NEW List Item Page Skeleton Component ---
function ListItemSkeleton() {
  return (
    <div className="skeleton-list-item-container">
      {/* Skeleton Left Column */}
      <section className="skeleton-photos-section">
        <div className="skeleton skeleton-photo-upload-box"></div>
        <div className="skeleton skeleton-photo-note"></div>
        <div className="skeleton-preview-grid">
          {Array.from({ length: 3 }).map((_, i) => ( // Show 3 preview skeletons
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
          {Array.from({ length: 4 }).map((_, i) => ( // Show 4 button skeletons
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
        <div className="skeleton skeleton-form-input" style={{ height: '30px', marginBottom: '1rem' }}></div> {/* Toggle skeleton */}
        <div className="skeleton skeleton-form-input" style={{ height: '30px' }}></div> {/* Toggle skeleton */}

      </section>
    </div>
  );
}


// --- Mock Category Data (Replace with API fetch) ---
const MOCK_CATEGORIES = [
  { categoryId: 1, name: 'Textbooks' },
  { categoryId: 2, name: 'Electronics' },
  { categoryId: 3, name: 'Furniture' },
  { categoryId: 4, name: 'Lab Equipment' },
  { categoryId: 5, name: 'Apparel' },
  { categoryId: 6, name: 'Other' },
];

// --- Mock School Data (Replace with API fetch) ---
const MOCK_SCHOOLS = [
  { id: 1, name: 'University of Wollongong' },
  { id: 2, name: 'TAFE Illawarra' },
  { id: 3, name: 'University of Sydney' },
  { id: 4, name: 'University of New South Wales' },
  { id: 5, name: 'Western Sydney University' },
  { id: 6, name: 'University of Technology Sydney' },
];

const CONDITION_OPTIONS = ['Brand New', 'Like New', 'Lightly Used', 'Well Used', 'Heavily Used'];

export default function ListItemPage() {
  const [userName, setUserName] = useState('');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Form State ---
  const [photos, setPhotos] = useState([]); // Array of File objects or preview URLs
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [condition, setCondition] = useState(''); // Selected condition button
  const [description, setDescription] = useState('');
  const [option, setOption] = useState('sale'); // 'sale' or 'rent'
  const [price, setPrice] = useState('');
  const [allowMeetup, setAllowMeetup] = useState(false);
  const [meetupPlace, setMeetupPlace] = useState('');
  const [allowDelivery, setAllowDelivery] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('');
  const fileInputRef = useRef(null); // Ref for hidden file input


  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch user
        const userResponse = await getCurrentUser();
        setUserName(userResponse.data?.fullName?.split(' ')[0] || 'User');

        // Fetch categories
        // const categoriesResponse = await getCategories();
        // setCategories(categoriesResponse.data);
        setCategories(MOCK_CATEGORIES); // Using mock for now

      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Could not load page data. Please try again.");
        if (err.message === "No authentication token found.") {
           navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // --- Handlers ---
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
    // Limit to 10 photos
    const availableSlots = 10 - photos.length;
    const filesToAdd = newFiles.slice(0, availableSlots);

    // Create preview URLs
    const newPhotoPreviews = filesToAdd.map(file => ({
        file: file, // Keep the actual file object
        previewUrl: URL.createObjectURL(file)
    }));

    setPhotos(prevPhotos => [...prevPhotos, ...newPhotoPreviews]);
  };

   const removePhoto = (indexToRemove) => {
      setPhotos(prevPhotos => prevPhotos.filter((_, index) => index !== indexToRemove));
       // Clean up object URL - important for performance
      // Note: This requires storing the URL somewhere to revoke later if needed
      // URL.revokeObjectURL(photos[indexToRemove].previewUrl);
   };


  // --- Drag and Drop Handlers ---
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


  const handleClearDetails = () => {
    setPhotos([]);
    setSelectedCategory('');
    setTitle('');
    setSelectedSchool('');
    setCondition('');
    setDescription('');
    setOption('sale');
    setPrice('');
    setAllowMeetup(false);
    setMeetupPlace('');
    setAllowDelivery(false);
    setDeliveryOption('');
    // TODO: Revoke all object URLs if stored
  };

  const handleListNow = (e) => {
    e.preventDefault();
    // Basic validation
    if (photos.length === 0 || !selectedCategory || !title || !selectedSchool || !condition || !description || !price) {
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

    // Prepare data for API
    const listingData = new FormData(); // Use FormData for file uploads
    photos.forEach(photo => listingData.append('images', photo.file)); // Append actual files
    listingData.append('categoryId', selectedCategory);
    listingData.append('title', title);
    listingData.append('schoolId', selectedSchool);
    listingData.append('condition', condition);
    listingData.append('description', description);
    listingData.append('listingType', option === 'rent' ? 'For Rent' : 'For Sale'); // Send backend expected value
    listingData.append('price', price);
    listingData.append('allowMeetup', allowMeetup);
    if (allowMeetup) listingData.append('meetupLocation', meetupPlace);
    listingData.append('allowDelivery', allowDelivery);
    if (allowDelivery) listingData.append('deliveryOptions', deliveryOption);
    // Add rentPeriod if option is 'rent' - requires additional state
    // if (option === 'rent') listingData.append('rentPeriod', rentPeriodState);


    console.log("Listing Data Prepared (FormData):", /* FormData can't be directly logged easily */ );
    console.log("Listing Details:", {
       selectedCategory, title, selectedSchool, condition, description, option, price, allowMeetup, meetupPlace, allowDelivery, deliveryOption
    });
    // TODO: Implement API call to submit listingData
    // try {
    //   await createListingApi(listingData);
    //   alert("Item listed successfully!");
    //   navigate('/dashboard'); // Or to the new listing's page
    // } catch (err) { alert("Failed to list item."); }

    alert("Item Listed! (Placeholder)"); // Placeholder
     navigate('/dashboard');
  };

  // --- Render ---
  if (isLoading) {
    return (
        <div className="profile-page"> {/* Container for Header */}
            <Header userName="" onLogout={handleLogout} />
            {/* Render the Skeleton within the page structure */}
            <div className="list-item-page-container skeleton"> {/* Add skeleton class for background */}
                <ListItemSkeleton />
            </div>
        </div>
     );
  }
   if (error) {
     return <div className="profile-page"><Header userName={userName} onLogout={handleLogout} /><div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div></div>;
  }

  return (
    <div className="profile-page"> {/* Reuse for header consistency */}
      <Header userName={userName} onLogout={handleLogout} />

      <form onSubmit={handleListNow}>
        <div className="list-item-page-container">

          {/* Left Column: Photos */}
          <section className="photos-section">
            <input
               type="file"
               multiple // Allow multiple files
               accept="image/*" // Accept only images
               ref={fileInputRef}
               onChange={handleFileSelect}
               style={{ display: 'none' }} // Hide the default input
               id="photoInput"
             />
             {/* Make the whole box clickable */}
            <div
                className="photo-upload-box"
                onClick={() => fileInputRef.current?.click()} // Trigger hidden input
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
                                type="button" // Prevent form submission
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
                className="form-input" // Reuse input style
              >
                <option value="" disabled>Select category</option>
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

            {/* School */}
            <div className="form-field-group">
              <label htmlFor="school" className="form-label">School</label>
              <select
                id="school"
                name="school"
                required
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="form-input"
              >
                <option value="" disabled>Select your school</option>
                {MOCK_SCHOOLS.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>

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
                  onClick={() => { setOption('sale'); setPrice(''); }} // Clear price on switch
                >
                  For Sale
                </button>
                <button
                  type="button"
                  className={`option-button ${option === 'rent' ? 'selected' : ''}`}
                  onClick={() => { setOption('rent'); setPrice(''); }} // Clear price on switch
                >
                  For Rent
                </button>
              </div>
              {/* Price Input - shown based on option */}
              <div className="option-price-input">
                <label htmlFor="price" className="form-label">
                  {option === 'sale' ? 'Enter your price for sale' : 'Enter your price for rent'}
                </label>
                 {/* TODO: Add 'per day/week' selector for rent */}
                <input
                  type="number" id="price" name="price" required value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="form-input" placeholder="0.00"
                  step="0.01" min="0" // Allow decimals, non-negative
                />
              </div>
            </div>

            {/* Deal Method */}
            <div className="form-field-group">
              <label className="form-label">Deal Method</label>
              {/* Meet-up */}
              <div className="deal-method-toggle">
                <span className="notification-label">Meet-up</span> {/* Reuse label style */}
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
              <button type="button" className="btn btn-clear" onClick={handleClearDetails}>
                Clear Details
              </button>
              <button type="submit" className="btn btn-list">
                List Now
              </button>
            </div>

          </section>
        </div>
      </form>
    </div>
  );
}
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import './Sell.css';

const MAX_PHOTOS = 10;

function Sell({ user, handleLogout }) {
  // State for the confirmation modal
  const [showClearModal, setShowClearModal] = useState(false);

  // State for form data
  const [images, setImages] = useState([]);
  const [condition, setCondition] = useState('Brand New');
  const [listingType, setListingType] = useState('For Sale');
  const [meetupEnabled, setMeetupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  
  // Refs for accessing form and file input elements
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    if (images.length + files.length > MAX_PHOTOS) {
      alert(`You can only upload a maximum of ${MAX_PHOTOS} photos.`);
      return;
    }
    const newImages = files.map(file => ({
      file: file,
      previewUrl: URL.createObjectURL(file)
    }));
    setImages(prevImages => [...prevImages, ...newImages]);
  };

  const handleDeleteImage = (indexToDelete) => {
    setImages(prevImages => prevImages.filter((_, index) => index !== indexToDelete));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert('Listing functionality is not yet connected to the backend.');
  };
  
  const handleClearDetailsClick = () => {
    setShowClearModal(true);
  };

  const handleConfirmClear = () => {
    setImages([]);
    setCondition('Brand New');
    setListingType('For Sale');
    setMeetupEnabled(true);
    setDeliveryEnabled(false);
    
    if (formRef.current) {
      formRef.current.reset();
    }
    
    setShowClearModal(false);
  };

  const isUploadDisabled = images.length >= MAX_PHOTOS;

  return (
    <div className="sell-page">
      <Header user={user} handleLogout={handleLogout} />

      <main className="sell-page-main">
        <form className="sell-form-grid" ref={formRef} onSubmit={handleSubmit}>
          {/* --- Photo Section --- */}
          <div className="photo-section">
            <div
              className={`photo-upload-box ${isUploadDisabled ? 'disabled' : ''}`}
              onClick={!isUploadDisabled ? () => fileInputRef.current.click() : undefined}
            >
              {isUploadDisabled ? (
                <div className="upload-placeholder disabled-text">
                  <i className="fas fa-images"></i>
                  <p>You've already uploaded {images.length}/{MAX_PHOTOS} photos</p>
                  <span>Delete a photo to add another one</span>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <i className="fas fa-images"></i>
                  <button type="button" className="select-photos-btn">Select photos</button>
                  <p>or drag photos here</p>
                  <span>(Up to {MAX_PHOTOS} photos)</span>
                </div>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              style={{ display: 'none' }}
              accept="image/*"
              multiple
              disabled={isUploadDisabled}
            />

            {images.length > 0 && (
              <div className="photo-thumbnail-grid">
                {images.map((image, index) => (
                  <div key={index} className="photo-thumbnail">
                    <img src={image.previewUrl} alt={`Preview ${index + 1}`} />
                    {index === 0 && <span className="cover-badge">COVER</span>}
                    <button 
                      type="button" 
                      className="delete-btn" 
                      onClick={() => handleDeleteImage(index)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- Right Column: Item Details --- */}
          <div className="details-section">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" defaultValue="">
                <option value="" disabled>Select a category</option>
                <option value="electronics">Electronics & Tech</option>
                <option value="study-materials">Study Materials</option>
                <option value="dorm-essentials">Dorm Essentials</option>
                <option value="clothing-uniforms">Clothing & Uniforms</option>
                <option value="rental-items">Rental Items</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">Item Title</label>
              <input id="title" type="text" />
            </div>

            <div className="form-group">
              <label>Condition</label>
              <div className="button-group">
                {['Brand New', 'Like New', 'Lightly Used', 'Well Used', 'Heavily Used'].map(c => (
                  <button
                    key={c}
                    type="button"
                    className={condition === c ? 'active' : ''}
                    onClick={() => setCondition(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="brand">Brand</label>
              <input id="brand" type="text" />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea></textarea>
            </div>

            <div className="form-group">
              <label>Price</label>
              <div className="price-options">
                <div className="button-group">
                  <button
                    type="button"
                    className={listingType === 'For Sale' ? 'active' : ''}
                    onClick={() => setListingType('For Sale')}
                  >
                    For Sale
                  </button>
                  <button
                    type="button"
                    className={listingType === 'For Rent' ? 'active' : ''}
                    onClick={() => setListingType('For Rent')}
                  >
                    For Rent
                  </button>
                </div>
                <input type="text" placeholder={`Price of your ${listingType === 'For Sale' ? 'item' : 'rental'}`} className="price-input" />
              </div>
            </div>

            <div className="form-group">
              <label className="highlighted-label">Deal Method</label>
              <div className="deal-method-group">
                <div className="deal-method-header">
                  <span>Meet-up</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={meetupEnabled} onChange={() => setMeetupEnabled(!meetupEnabled)} />
                    <span className="slider"></span>
                  </label>
                </div>
                {meetupEnabled && (
                  <div className="deal-method-content">
                    <input type="text" placeholder="Add location" />
                  </div>
                )}
              </div>
              <div className="deal-method-group">
                <div className="deal-method-header">
                  <span>Delivery</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={deliveryEnabled} onChange={() => setDeliveryEnabled(!deliveryEnabled)} />
                    <span className="slider"></span>
                  </label>
                </div>
                {deliveryEnabled && (
                  <div className="deal-method-content">
                    <textarea placeholder="Are there additional mailing or delivery fees and options?"></textarea>
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="clear-details-btn"
                onClick={handleClearDetailsClick}
              >
                Clear details
              </button>
              <button type="submit" className="list-now-btn">List now</button>
            </div>
          </div>
        </form>
      </main>

      {showClearModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Clear all the details?</h2>
            <p>This will remove everything you've filled in so far. You'll start with a blank form.</p>
            <div className="modal-actions">
              <button 
                type="button" 
                className="modal-btn back-btn" 
                onClick={() => setShowClearModal(false)}
              >
                Back
              </button>
              <button 
                type="button" 
                className="modal-btn clear-all-btn"
                onClick={handleConfirmClear}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sell;
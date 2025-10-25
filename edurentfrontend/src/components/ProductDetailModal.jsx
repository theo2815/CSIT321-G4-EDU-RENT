// src/components/ProductDetailModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // To navigate to chat

// Import CSS
import '../static/ProductDetailModal.css';
// Import shared modal overlay/base styles if they are separate
import '../static/ProfilePage.css'; // Assuming modal-overlay is here

// --- Mock Seller Data (Replace with data from listing or separate fetch) ---
const MOCK_SELLER = {
  id: 101,
  username: 'Jane D.',
  avatarUrl: null, // 'https://via.placeholder.com/45',
  reviewCount: 5,
  ratingAvg: 4.8,
};

export default function ProductDetailModal({ listing, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  // Handle case where listing data isn't passed correctly
  if (!listing) return null;

  // --- Mock Images (Replace with listing.images array) ---
  const images = listing.images || [
    listing.image, // Use main image if available
    'https://via.placeholder.com/400x400?text=Image+2',
    'https://via.placeholder.com/400x400?text=Image+3',
  ].filter(img => img); // Filter out null/undefined main image

  const showArrows = images.length > 1;

  const handlePrevImage = (e) => {
    e.stopPropagation(); // Prevent closing modal if clicking arrow over overlay
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = (e) => {
     e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChatClick = () => {
      console.log(`Initiating chat for listing ${listing.id} with seller ${MOCK_SELLER.id}`);
      // TODO: Implement logic to find or create a conversation
      // Navigate to the messages page, potentially passing conversation ID
      navigate('/messages'); // Simple navigation for now
      onClose(); // Close modal after clicking chat
  };

  // --- Format Data ---
  const priceDisplay = `₱${listing.price?.toFixed(2)}`;
  // Assume seller comes with listing data or is fetched separately
  const seller = listing.seller || MOCK_SELLER;

  return (
    <div className="modal-overlay visible" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="product-name">
      <div className="product-modal-content">

        {/* Image Section */}
        <section className="product-image-section">
          {images.length > 0 ? (
            <img
              src={images[currentImageIndex]}
              alt={`${listing.title} - Image ${currentImageIndex + 1}`}
              className="product-image-main"
            />
          ) : (
             <div className="hero-image-placeholder" style={{width: '100%', height: '100%', borderRadius: 0}}>No Image Available</div>
          )}

          {/* Navigation Arrows */}
          {showArrows && (
            <>
              <button
                className="image-nav-arrow left"
                onClick={handlePrevImage}
                aria-label="Previous image"
              >
                &#10094; {/* Left arrow */}
              </button>
              <button
                className="image-nav-arrow right"
                onClick={handleNextImage}
                aria-label="Next image"
              >
                &#10095; {/* Right arrow */}
              </button>
            </>
          )}
        </section>

        {/* Details Section */}
        <section className="product-details-section">
          {/* Close button for details section */}
           <button onClick={onClose} className="product-modal-close-btn" aria-label="Close modal">
             &times;
           </button>

          {/* Product Info */}
          <div>
            <h2 id="product-name" className="product-info-name">{listing.title}</h2>
            <p className="product-info-price">{priceDisplay}</p>

            <div className="product-info-block">
              <span className="product-info-label">Location:</span>
              <span className="product-info-value">{listing.location || 'Campus Area'}</span> {/* Add location field to mock data */}
            </div>
            <div className="product-info-block">
              <span className="product-info-label">School:</span>
              <span className="product-info-value">{listing.school || 'Not specified'}</span>
            </div>
            <div className="product-info-block">
              <span className="product-info-label">Condition:</span>
              <span className="product-info-value">{listing.condition || 'Not specified'}</span> {/* Add condition field */}
            </div>
             <div className="product-info-block">
                <span className="product-info-label">Deal Method:</span>
                 {/* Add deal method fields */}
                <span className="product-info-value">{listing.dealMethod || 'Meet-up preferred'}</span>
             </div>
            <div className="product-info-block">
              <span className="product-info-label">Description:</span>
              <p className="product-info-value product-info-description">
                {listing.description || 'No description available.'}
              </p>
            </div>
          </div>

          {/* Seller Info */}
          <div className="seller-info-section">
            <div className="seller-info-header">
              <img
                src={seller.avatarUrl || 'https://via.placeholder.com/45'}
                alt={`${seller.username}'s avatar`}
                className="seller-avatar"
              />
              <div className="seller-details">
                <div className="seller-username">{seller.username}</div>
                {/* Display rating or review count */}
                <div className="seller-reviews">
                   {/* Example: ⭐ {seller.ratingAvg} ({seller.reviewCount} Reviews) */}
                   {seller.reviewCount > 0 ? `${seller.reviewCount} Reviews` : 'No reviews yet'}
                </div>
              </div>
            </div>
            <div className="action-note">
              {listing.type === 'rent' ? 'Want to rent the item?' : 'Want to buy the item?'}
            </div>
            <button className="btn-chat" onClick={handleChatClick}>
              Chat with the Seller
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
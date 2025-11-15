// src/components/ProductDetailModalSkeleton.jsx
import React from 'react';

// Import CSS
import '../static/ProductDetailModal.css';
import '../static/ProfilePage.css'; // For modal-overlay styles

export default function ProductDetailModalSkeleton({ onClose }) {

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay visible" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="product-name">
      <div className="product-modal-content">

        {/* Image Section */}
        <section className="product-image-section">
          <div className="skeleton" style={{ width: '100%', height: '100%' }}></div>
        </section>

        {/* Details Section */}
        <section className="product-details-section">
          <button onClick={onClose} className="product-modal-close-btn" aria-label="Close modal">&times;</button>

          {/* Product Info Skeleton */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div id="product-name" className="skeleton skeleton-text" style={{ height: '2.5rem', width: '70%', marginBottom: '0.5rem' }}></div>
              <div className="skeleton" style={{ height: '30px', width: '30px', borderRadius: '50%', flexShrink: 0, top: '5px', position: 'relative' }}></div>
            </div>

            <div className="skeleton skeleton-text" style={{ height: '2rem', width: '30%', marginBottom: '1.5rem' }}></div>
            
            <div className="product-info-block">
              <div className="skeleton skeleton-text" style={{ height: '1rem', width: '40%', marginBottom: '0.5rem' }}></div>
              <div className="skeleton skeleton-text" style={{ height: '1rem', width: '60%' }}></div>
            </div>
            <div className="product-info-block">
              <div className="skeleton skeleton-text" style={{ height: '1rem', width: '40%', marginBottom: '0.5rem' }}></div>
              <div className="skeleton skeleton-text" style={{ height: '1rem', width: '50%' }}></div>
            </div>
            <div className="product-info-block">
              <div className="skeleton skeleton-text" style={{ height: '1rem', width: '40%', marginBottom: '0.5rem' }}></div>
              <div className="skeleton skeleton-text" style={{ height: '1rem', width: '70%' }}></div>
            </div>
            <div className="product-info-block">
              <div className="skeleton skeleton-text" style={{ height: '1rem', width: '40%', marginBottom: '0.5rem' }}></div>
              <div className="skeleton skeleton-text" style={{ height: '1rem', width: '100%' }}></div>
              <div className="skeleton skeleton-text" style={{ height: '1rem', width: '100%', marginTop: '0.25rem' }}></div>
              <div className="skeleton skeleton-text" style={{ height: '1rem', width: '80%', marginTop: '0.25rem' }}></div>
            </div>
          </div>

          {/* Seller Info Skeleton */}
          <div className="seller-info-section">
            <div className="seller-info-header">
              <div className="skeleton seller-avatar" style={{ borderRadius: '50%' }}></div>
              <div className="seller-details" style={{ flexGrow: 1 }}>
                <div className="skeleton skeleton-text" style={{ height: '1rem', width: '50%', marginBottom: '0.5rem' }}></div>
                <div className="skeleton skeleton-text" style={{ height: '1rem', width: '30%' }}></div>
              </div>
            </div>
            <div className="skeleton skeleton-text" style={{ height: '1rem', width: '40%', marginTop: '0.75rem' }}></div>
            <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '8px', marginTop: '0.5rem' }}></div>
          </div>

        </section>
      </div>
    </div>
  );
}
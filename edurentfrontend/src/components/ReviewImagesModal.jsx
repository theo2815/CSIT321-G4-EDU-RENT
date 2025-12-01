// This Component displays a modal to review images in a larger view with navigation
import React, { useState } from 'react';
import '../static/ProductDetailModal.css'; 

// Added 'initialIndex' prop
export default function ReviewImagesModal({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!images || images.length === 0) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="modal-overlay visible" onClick={onClose} style={{ zIndex: 1300 }}>
      <div 
        className="product-modal-content" 
        style={{ width: 'auto', maxWidth: '90%', maxHeight: '90vh', background: 'transparent', boxShadow: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          <img 
            src={images[currentIndex]} 
            alt={`Review ${currentIndex + 1}`} 
            style={{ maxHeight: '85vh', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
          />

          {images.length > 1 && (
            <>
              <button 
                className="image-nav-arrow left" 
                onClick={handlePrev}
                style={{ position: 'fixed', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 1301 }}
              >
                &#10094;
              </button>
              
              <button 
                className="image-nav-arrow right" 
                onClick={handleNext}
                style={{ position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 1301 }}
              >
                &#10095;
              </button>
            </>
          )}

          <button 
            onClick={onClose} 
            className="product-modal-close-btn"
            style={{ position: 'fixed', top: '20px', right: '20px', background: 'white' }}
          >
            &times;
          </button>
          
          <div style={{ 
              position: 'fixed', 
              bottom: '20px', 
              color: 'white', 
              background: 'rgba(0,0,0,0.5)', 
              padding: '5px 10px', 
              borderRadius: '20px' 
          }}>
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </div>
    </div>
  );
}
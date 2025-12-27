// This Component provides a modal for creating or editing reviews, including image uploads
import React, { useState, useRef, useEffect } from 'react';
import { createReview, updateReview } from '../services/apiService';
import LoadingOverlay from './LoadingOverlay';
import '../static/ProductDetailModal.css';

// New Feedback Hook
import { useToast } from '../hooks/useToast';

// Helper function to resolve image paths (handles both relative paths from DB and absolute URLs)
const getImageUrl = (path) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${import.meta.env.VITE_BACKEND_URL}${path}`;
};

export default function ReviewModal({ 
  transactionId, 
  reviewerId, 
  otherUserName, 
  onClose, 
  onSuccess, 
  initialReview = null // If provided, the modal operates in "Edit Mode"
}) {
  // Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize feedback tools
  const { showSuccess, showError, showWarning } = useToast();

  // Image Management State
  // existingImages: Images currently saved in the database (for Edit Mode)
  const [existingImages, setExistingImages] = useState([]); 
  // imagesToDelete: IDs of existing images the user wants to remove during an edit
  const [imagesToDelete, setImagesToDelete] = useState([]); 
  // newImages: Freshly selected File objects to be uploaded
  const [newImages, setNewImages] = useState([]);            
  
  const fileInputRef = useRef(null);
  const isEditMode = !!initialReview;

  // Initialization Effect
  // If editing, populate the form with the review's existing data
  useEffect(() => {
    if (initialReview) {
      setRating(initialReview.rating);
      setComment(initialReview.comment);
      // Load existing images from the review object
      setExistingImages(initialReview.reviewImages || []);
    }
  }, [initialReview]);

  // Image Handlers
  // Handle selection of NEW files from the file input
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Filter out duplicates based on name and size
    const uniqueFiles = files.filter(newFile => {
        const isDuplicate = newImages.some(
            existing => existing.name === newFile.name && existing.size === newFile.size
        );
        return !isDuplicate;
    });

    if (uniqueFiles.length === 0) return;

    // Limit check
    const currentCount = existingImages.length + newImages.length;
    if (currentCount + uniqueFiles.length > 3) {
      showWarning("You can upload a maximum of 3 photos.");
      return;
    }
    
    setNewImages(prev => [...prev, ...uniqueFiles]);
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingImage = (imageId) => {
    setImagesToDelete(prev => [...prev, imageId]); 
    setExistingImages(prev => prev.filter(img => img.id !== imageId)); 
  };

  // Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (isEditMode) {
        // UPDATE FLOW
        // Send updated text, IDs of images to delete, and new files to upload
        await updateReview(initialReview.id, { 
            rating, 
            comment,
            imagesToDelete,
            newImages
        });
        showSuccess('Review updated successfully!');
      } else {
        // CREATE FLOW
        // Create a fresh review with rating, comment, and new files
        await createReview({
          rating,
          comment,
          transactionId,
          reviewerId,
          images: newImages
        });
        showSuccess('Review submitted successfully!');
      }
      
      // Refresh parent data and close modal
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to submit review:', error);
      showError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay visible" style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditMode ? 'Edit Review' : `Review ${otherUserName}`}
          </h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 1rem 1rem' }}>
          
          {/* Star Rating Section */}
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', cursor: 'pointer' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  onClick={() => setRating(star)} 
                  style={{ color: star <= rating ? '#FFC107' : '#e4e5e9' }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Comment Text Area */}
          <div style={{ marginBottom: '1rem' }}>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="Write your experience..." 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              required 
              style={{ width: '100%', resize: 'none' }} 
            />
          </div>

          {/* Image Upload & Management Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{display:'block', marginBottom:'0.5rem'}}>
              Photos (Max 3)
            </label>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              
              {/* 1. Render Existing Images (From Database) */}
              {existingImages.map((img) => (
                <div key={img.id} style={{ position: 'relative', width: '60px', height: '60px' }}>
                  <img 
                    src={getImageUrl(img.url)} 
                    alt="review" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => removeExistingImage(img.id)} 
                    style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '18px', height: '18px', border: 'none', cursor: 'pointer', fontSize: '10px', lineHeight: 1 }}
                  >
                    X
                  </button>
                </div>
              ))}

              {/* 2. Render New Images (Local Previews) */}
              {newImages.map((file, index) => (
                <div key={`new-${index}`} style={{ position: 'relative', width: '60px', height: '60px' }}>
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="new preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', opacity: 0.8, border: '1px solid #2ecc71' }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => removeNewImage(index)} 
                    style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '18px', height: '18px', border: 'none', cursor: 'pointer', fontSize: '10px', lineHeight: 1 }}
                  >
                    X
                  </button>
                </div>
              ))}

              {/* 3. Add Button (Visible only if total limit < 3) */}
              {(existingImages.length + newImages.length) < 3 && (
                <div 
                  onClick={() => fileInputRef.current.click()} 
                  style={{ width: '60px', height: '60px', border: '2px dashed #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', fontSize: '1.5rem' }}
                >
                  +
                </div>
              )}
            </div>
            
            {/* Hidden Input for File Selection */}
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary-accent" disabled={isSubmitting} style={{ width: '100%' }}>
            {isSubmitting 
              ? 'Saving...' 
              : (isEditMode ? 'Update Review' : 'Submit Review')
            }
          </button>
        </form>
      </div>
      <LoadingOverlay isVisible={isSubmitting} message={isEditMode ? "Updating Review..." : "Submitting Review..."} />
    </div>
  );
}
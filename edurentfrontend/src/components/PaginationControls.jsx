import React from 'react';

export default function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
      <button
        className="btn btn-outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        style={{ padding: '0.5rem 1rem' }}
      >
        Previous
      </button>
      
      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Page <strong>{currentPage + 1}</strong> of <strong>{totalPages}</strong>
      </span>

      <button
        className="btn btn-outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        style={{ padding: '0.5rem 1rem' }}
      >
        Next
      </button>
    </div>
  );
}
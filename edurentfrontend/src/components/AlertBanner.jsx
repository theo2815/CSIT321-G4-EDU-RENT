import React from 'react';
import '../static/Feedback.css';

export default function AlertBanner({ type = 'error', message }) {
  if (!message) return null;
  
  return (
    <div className={`alert-banner ${type}`}>
      <span>{type === 'error' ? 'XY' : '✅'}</span>
      <span>{message}</span>
    </div>
  );
}
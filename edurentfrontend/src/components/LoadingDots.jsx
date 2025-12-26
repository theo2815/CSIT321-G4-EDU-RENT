import React from 'react';

export default function LoadingDots({ size = 'default' }) {
  // size can be 'default' (large) or 'small' (for buttons)
  return (
    <section className={`dots-container ${size}`}>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </section>
  );
}

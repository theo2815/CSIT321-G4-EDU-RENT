import React from 'react';

// Simple, elegant spinner matching the app theme
const PageLoader = () => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100%',
            backgroundColor: 'var(--bg-secondary, #f8f9fa)' // Fallback to light gray
        }}>
            <div className="spinner" style={{
                width: '50px',
                height: '50px',
                border: '4px solid rgba(0, 119, 182, 0.2)', // Light primary color
                borderTop: '4px solid #0077B6', // Primary Brand Color
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default PageLoader;

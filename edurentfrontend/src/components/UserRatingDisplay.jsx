// This component displays the average rating and review count for a user.
import React, { useState, useEffect } from 'react';
import { getUserReviews } from '../services/apiService';

// initialData prop
export default function UserRatingDisplay({ userId, align = 'left', initialData = null }) {
  const [stats, setStats] = useState({ 
    avg: initialData ? initialData.avg : 0, 
    count: initialData ? initialData.count : 0, 
    loading: !initialData 
  });

  useEffect(() => {
    if (!userId || initialData) return;

    let isMounted = true;
    const fetchStats = async () => {
      try {
        const response = await getUserReviews(userId);
        if (!isMounted) return;

        const reviews = response.data || [];
        const count = reviews.length;
        const avg = count > 0 
          ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1)
          : 0;
        
        setStats({ avg, count, loading: false });
      } catch (err) {
        console.error("Failed to load user rating", err);
        if (isMounted) setStats({ avg: 0, count: 0, loading: false });
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, [userId, initialData]);


  if (stats.loading) {
    return null; 
  }

  if (stats.count === 0) {
    return <div style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>No reviews yet</div>;
  }

  return (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px', 
        fontSize: '0.85rem',
        justifyContent: align === 'center' ? 'center' : 'flex-start'
    }}>
      <span style={{ color: '#FFC107', fontSize: '1rem' }}>★</span>
      <span style={{ fontWeight: '700', color: 'var(--text-color)' }}>{stats.avg}</span>
      <span style={{ color: '#6c757d', marginLeft: '2px' }}>({stats.count} reviews)</span>
    </div>
  );
}
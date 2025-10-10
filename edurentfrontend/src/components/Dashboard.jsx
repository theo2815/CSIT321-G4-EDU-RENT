import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/api';

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        setProducts(response.data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products from the server.");
      }
    };
    fetchProducts();
  }, []);

  // Simple logout by reloading the page, which resets our app's state
  const handleLogout = () => {
    window.location.reload();
  };
  
  // Helper to get the right CSS class for product status
  const getStatusClass = (status) => {
    switch (status) {
      case 'available':
        return 'status-available';
      case 'rented':
        return 'status-rented';
      case 'sold':
        return 'status-sold';
      default:
        return '';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Marketplace</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="product-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.productId} className="product-card">
              <h4>{product.name}</h4>
              <p>{product.description}</p>
              <p><strong>Price:</strong> ${product.price.toFixed(2)}</p>
              <p>
                <strong>Status:</strong>
                <span className={`product-status ${getStatusClass(product.status)}`}>
                  {product.status}
                </span>
              </p>
              <small>Posted on: {new Date(product.postDate).toLocaleDateString()}</small>
            </div>
          ))
        ) : (
          <p>No products found or still loading...</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
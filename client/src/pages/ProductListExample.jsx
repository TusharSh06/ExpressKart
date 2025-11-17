import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ProductImages.css';

function ProductListExample() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products/all');
      setProducts(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="products-grid">
      {products.map(product => (
        <div key={product._id} className="product-card">
          {/* Product Image Thumbnail */}
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0].url} 
              alt={product.title}
              className="product-thumbnail"
            />
          ) : (
            <div className="no-image-placeholder">No Image</div>
          )}
          
          <h3>{product.title}</h3>
          <p className="description">{product.description}</p>
          <p className="price">₹{product.price.sellingPrice}</p>
          <button className="view-details-btn">View Details</button>
        </div>
      ))}
    </div>
  );
}

export default ProductListExample;

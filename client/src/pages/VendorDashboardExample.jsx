import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductForm from '../components/ProductForm';
import ProductImageGallery from '../components/ProductImageGallery';
import '../styles/ProductImages.css';

function VendorDashboardExample() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorProducts();
  }, []);

  const fetchVendorProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/products/vendor/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProducts(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vendor products:', error);
      setLoading(false);
    }
  };

  const handleImagesUploaded = (updatedProduct) => {
    setProducts(products.map(p => 
      p._id === updatedProduct._id ? updatedProduct : p
    ));
    alert('Images uploaded successfully!');
  };

  const handleImageDeleted = (updatedProduct) => {
    setProducts(products.map(p => 
      p._id === updatedProduct._id ? updatedProduct : p
    ));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="vendor-dashboard">
      <h2>My Products</h2>

      <div className="products-list">
        {products.map(product => (
          <div key={product._id} className="product-item">
            <h3>{product.title}</h3>
            <p>{product.description}</p>

            {/* Image Gallery */}
            {product.images && product.images.length > 0 && (
              <div className="images-section">
                <h4>Product Images</h4>
                <ProductImageGallery
                  product={product}
                  isOwner={true}
                  onImageDeleted={handleImageDeleted}
                />
              </div>
            )}

            {/* Upload More Images */}
            <div className="upload-section">
              <h4>Add More Images</h4>
              <ProductForm
                productId={product._id}
                onSuccess={handleImagesUploaded}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorDashboardExample;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductForm from '../components/ProductForm';
import ProductImageGallery from '../components/ProductImageGallery';
import '../styles/ProductImages.css';

function ProductEditExample({ productId }) {
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({});
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProduct(response.data.data);
      setFormData(response.data.data);
      setIsOwner(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  const handleImagesUploaded = (updatedProduct) => {
    setProduct(updatedProduct);
    alert('Images uploaded successfully!');
  };

  const handleImageDeleted = (updatedProduct) => {
    setProduct(updatedProduct);
  };

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="product-edit-container">
      <h2>Edit Product</h2>

      {/* Image Gallery */}
      {product.images && product.images.length > 0 && (
        <div className="images-section">
          <h3>Product Images</h3>
          <ProductImageGallery
            product={product}
            isOwner={isOwner}
            onImageDeleted={handleImageDeleted}
          />
        </div>
      )}

      {/* Upload Images */}
      {isOwner && (
        <div className="upload-section">
          <h3>Add More Images</h3>
          <ProductForm
            productId={productId}
            onSuccess={handleImagesUploaded}
          />
        </div>
      )}
    </div>
  );
}

export default ProductEditExample;

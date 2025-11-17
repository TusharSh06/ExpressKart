import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductImageGallery from '../components/ProductImageGallery';
import '../styles/ProductImages.css';

function ProductDetailsExample({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${productId}`);
      setProduct(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="product-details-container">
      <div className="product-images-container">
        {/* Image Gallery */}
        {product.images && product.images.length > 0 ? (
          <ProductImageGallery
            product={product}
            isOwner={false}
            onImageDeleted={() => {}}
          />
        ) : (
          <div className="no-image-placeholder">No images available</div>
        )}
      </div>

      <div className="product-info">
        <h1>{product.title}</h1>
        <p className="description">{product.description}</p>
        <p className="price">Price: ₹{product.price.sellingPrice}</p>
        <button className="add-to-cart-btn">Add to Cart</button>
      </div>
    </div>
  );
}

export default ProductDetailsExample;

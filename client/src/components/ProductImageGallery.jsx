import React, { useState } from 'react';
import axios from 'axios';

export default function ProductImageGallery({ product, isOwner, onImageDeleted }) {
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleDeleteImage = async (publicId) => {
    if (!window.confirm('Delete this image?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `/api/products/${product._id}/images/${publicId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      onImageDeleted && onImageDeleted(response.data.data);
    } catch (err) {
      alert('Failed to delete image: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!product.images || product.images.length === 0) {
    return <p>No images available</p>;
  }

  const currentImage = product.images[selectedImageIndex];

  return (
    <div className="product-gallery">
      <div className="main-image">
        <img src={currentImage.url} alt="Product" />
        {isOwner && (
          <button
            onClick={() => handleDeleteImage(currentImage.public_id)}
            disabled={loading}
            className="delete-btn"
          >
            ✕ Delete
          </button>
        )}
      </div>

      {product.images.length > 1 && (
        <div className="thumbnails">
          {product.images.map((image, index) => (
            <div
              key={index}
              className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
              onClick={() => setSelectedImageIndex(index)}
            >
              <img src={image.url} alt={`Thumbnail ${index + 1}`} />
            </div>
          ))}
        </div>
      )}

      <p className="image-counter">
        {selectedImageIndex + 1} / {product.images.length}
      </p>
    </div>
  );
}

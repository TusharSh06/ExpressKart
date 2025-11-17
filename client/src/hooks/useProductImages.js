import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook for managing product images
 * Handles upload, delete, and state management
 */
export const useProductImages = (productId) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  // Upload images to product
  const uploadImages = useCallback(async (files) => {
    if (!files || files.length === 0) {
      setError('No files selected');
      return false;
    }

    if (files.length > 6) {
      setError('Maximum 6 images allowed');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await axios.post(
        `/api/products/${productId}/images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setImages(response.data.data.images || []);
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMsg);
      console.error('Upload error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [productId, token]);

  // Delete single image
  const deleteImage = useCallback(async (publicId) => {
    if (!window.confirm('Delete this image?')) return false;

    setLoading(true);
    setError('');

    try {
      const response = await axios.delete(
        `/api/products/${productId}/images/${publicId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setImages(response.data.data.images || []);
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Delete failed';
      setError(errorMsg);
      console.error('Delete error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [productId, token]);

  // Delete all images
  const deleteAllImages = useCallback(async () => {
    if (!window.confirm('Delete all images?')) return false;

    setLoading(true);
    setError('');

    try {
      const response = await axios.delete(
        `/api/products/${productId}/images`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setImages([]);
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Delete failed';
      setError(errorMsg);
      console.error('Delete all error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [productId, token]);

  // Set images (for initialization)
  const setProductImages = useCallback((newImages) => {
    setImages(newImages || []);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    images,
    loading,
    error,
    uploadImages,
    deleteImage,
    deleteAllImages,
    setProductImages,
    clearError
  };
};

export default useProductImages;

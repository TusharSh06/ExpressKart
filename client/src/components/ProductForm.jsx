import React, { useState, useRef } from 'react';
import axios from 'axios';

export default function ProductForm({ productId, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length > 6) {
      setError('Maximum 6 images allowed');
      return;
    }

    setFiles(selectedFiles);
    setError('');

    const previewUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  const handleUpload = async () => {
    if (!files.length) {
      setError('Please select at least one image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const token = localStorage.getItem('token');
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

      setFiles([]);
      setPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      onSuccess && onSuccess(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form">
      <div className="image-upload-section">
        <h3>Product Images (Max 6)</h3>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          className="file-input"
        />

        {previews.length > 0 && (
          <div className="preview-container">
            {previews.map((preview, index) => (
              <div key={index} className="preview-item">
                <img src={preview} alt={`Preview ${index + 1}`} />
              </div>
            ))}
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={loading || !files.length}
          className="upload-btn"
        >
          {loading ? 'Uploading...' : `Upload ${files.length} Image(s)`}
        </button>
      </div>
    </div>
  );
}

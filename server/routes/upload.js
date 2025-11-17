const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../uploads/products'),
  path.join(__dirname, '../uploads/vendors'),
  path.join(__dirname, '../uploads/profiles')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper function to save file locally
const saveFileLocally = (file, folder = 'profiles') => {
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.originalname}`;
  const uploadDir = path.join(__dirname, `../uploads/${folder}`);
  const filepath = path.join(uploadDir, filename);
  
  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(filepath, file.buffer);
  
  return {
    filename,
    url: `/uploads/${folder}/${filename}`,
    path: filepath,
    size: file.size,
    mimetype: file.mimetype
  };
};

// Upload single image (for profile pictures, logos, etc.)
router.post('/single', protect, uploadSingle, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const folder = req.body.folder || 'profiles';
    const result = saveFileLocally(req.file, folder);

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        publicId: result.filename,
        url: result.url,
        size: result.size,
        mimetype: result.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading single image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

// Upload multiple images (for product galleries, vendor galleries, etc.)
router.post('/multiple', protect, uploadMultiple, handleUploadError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const folder = req.body.folder || 'profiles';
    const uploadedImages = req.files.map(file => saveFileLocally(file, folder));

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: uploadedImages.map(img => ({
        publicId: img.filename,
        url: img.url,
        size: img.size,
        mimetype: img.mimetype
      }))
    });
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

// Upload product images
router.post('/product', protect, authorize(['vendor', 'admin']), uploadMultiple, handleUploadError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No product images uploaded'
      });
    }

    const uploadedImages = req.files.map(file => saveFileLocally(file, 'products'));

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} product images uploaded successfully`,
      data: uploadedImages.map(img => ({
        publicId: img.filename,
        url: img.url,
        size: img.size,
        mimetype: img.mimetype
      }))
    });
  } catch (error) {
    console.error('Error uploading product images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload product images',
      error: error.message
    });
  }
});

// Upload vendor images (logo, banner, gallery)
router.post('/vendor', protect, authorize(['vendor', 'admin']), uploadMultiple, handleUploadError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No vendor images uploaded'
      });
    }

    const uploadedImages = req.files.map(file => saveFileLocally(file, 'vendors'));

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} vendor images uploaded successfully`,
      data: uploadedImages.map(img => ({
        publicId: img.filename,
        url: img.url,
        size: img.size,
        mimetype: img.mimetype
      }))
    });
  } catch (error) {
    console.error('Error uploading vendor images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload vendor images',
      error: error.message
    });
  }
});

// Delete image by public ID (filename)
router.delete('/:publicId', protect, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Search for file in uploads directory
    const uploadsDir = path.join(__dirname, '../uploads');
    let found = false;
    
    const searchForFile = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (searchForFile(fullPath)) return true;
        } else if (file === publicId) {
          fs.unlinkSync(fullPath);
          found = true;
          return true;
        }
      }
      return false;
    };
    
    searchForFile(uploadsDir);
    
    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
});

// Delete multiple images
router.delete('/multiple', protect, async (req, res) => {
  try {
    const { publicIds } = req.body;
    
    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of public IDs to delete'
      });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    let deletedCount = 0;
    
    const searchForFile = (dir, filename) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (searchForFile(fullPath, filename)) return true;
        } else if (file === filename) {
          fs.unlinkSync(fullPath);
          return true;
        }
      }
      return false;
    };
    
    publicIds.forEach(publicId => {
      if (searchForFile(uploadsDir, publicId)) {
        deletedCount++;
      }
    });
    
    res.json({
      success: true,
      message: `${deletedCount} images deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete images',
      error: error.message
    });
  }
});

module.exports = router;

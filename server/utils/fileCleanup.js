const fs = require('fs');
const path = require('path');

/**
 * Remove a temporary file after it has been processed
 * @param {string} filePath - Path to the file to remove
 */
const removeFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Temporary file removed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error removing temporary file ${filePath}:`, error);
  }
};

/**
 * Clean up temporary files after they've been processed
 * @param {Object} req - Express request object
 */
const cleanupTempFiles = (req) => {
  try {
    // Clean up single file
    if (req.file && req.file.path) {
      removeFile(req.file.path);
    }

    // Clean up multiple files
    if (req.files) {
      // Handle array of files
      if (Array.isArray(req.files)) {
        req.files.forEach(file => {
          if (file.path) removeFile(file.path);
        });
      } 
      // Handle object with arrays of files
      else {
        Object.keys(req.files).forEach(key => {
          const files = req.files[key];
          if (Array.isArray(files)) {
            files.forEach(file => {
              if (file.path) removeFile(file.path);
            });
          } else if (files.path) {
            removeFile(files.path);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
  }
};

module.exports = {
  removeFile,
  cleanupTempFiles
};

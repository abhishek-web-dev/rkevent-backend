const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

/**
 * Check if Cloudinary is properly configured.
 */
const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  
  return name && key && secret && 
         name !== 'dummy_cloud_name' && 
         key !== 'dummy_api_key' && 
         secret !== 'dummy_api_secret';
};

/**
 * Save an in-memory file buffer locally.
 */
const saveLocally = async (fileBuffer, folder) => {
  const uploadsDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Clean folder name to create valid filename prefix
  const prefix = folder.replace(/[^a-zA-Z0-9]/g, '-');
  const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
  const filePath = path.join(uploadsDir, filename);
  
  await fs.promises.writeFile(filePath, fileBuffer);
  
  const port = process.env.PORT || 5000;
  return {
    secure_url: `http://localhost:${port}/uploads/${filename}`,
    public_id: filename
  };
};

/**
 * Upload an in-memory buffer to Cloudinary (or local storage fallback).
 * @param {Buffer} fileBuffer - The multer buffer of the uploaded file
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<object>} Cloudinary upload response object (or local mock)
 */
const uploadToCloudinary = async (fileBuffer, folder = 'rk-event-invoice') => {
  if (!fileBuffer) {
    throw new Error('File buffer is empty');
  }

  if (!isCloudinaryConfigured()) {
    console.log('Cloudinary not configured or using dummy keys. Saving file locally...');
    return saveLocally(fileBuffer, folder);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an asset from Cloudinary or local storage.
 * @param {string} publicId - The public ID of the asset
 * @returns {Promise<object>} Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured()) {
    console.log('Cloudinary not configured. Cleaning up local file:', publicId);
    const filePath = path.join(__dirname, '../../public/uploads', publicId);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return { result: 'ok' };
    } catch (error) {
      console.error(`Local file deletion failed: ${error.message}`);
      return { result: 'error' };
    }
  }

  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Cloudinary deletion failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};

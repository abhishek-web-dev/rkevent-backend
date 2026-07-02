const cloudinary = require('../config/cloudinary');

/**
 * Upload an in-memory buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The multer buffer of the uploaded file
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<object>} Cloudinary upload response object
 */
const uploadToCloudinary = (fileBuffer, folder = 'rk-event-invoice') => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error('File buffer is empty'));
    }

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
 * Delete an asset from Cloudinary using its public ID.
 * @param {string} publicId - The public ID of the asset
 * @returns {Promise<object>} Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId) => {
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

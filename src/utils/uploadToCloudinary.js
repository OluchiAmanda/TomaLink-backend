const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

/**
 * Uploads an in-memory file buffer (from multer's memoryStorage) to
 * Cloudinary via a stream, so nothing is ever written to local disk.
 * Resolves with Cloudinary's result object (secure_url, public_id, etc.).
 */
const uploadBufferToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    Readable.from(buffer).pipe(uploadStream);
  });

module.exports = uploadBufferToCloudinary;

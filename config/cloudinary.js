// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage settings
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resourceType = 'auto';

    // Explicitly set resource type for documents
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/vnd.ms-powerpoint' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      resourceType = 'raw';
    }

    return {
      folder: 'education-platform',
      resource_type: resourceType, // <--- ensures PDFs/DOCs are stored correctly
      format: file.mimetype.split('/')[1], // keep original extension
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, // unique name
    };
  },
});

module.exports = { cloudinary, storage };

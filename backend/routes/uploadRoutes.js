const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET
});

const imageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const videoMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

// Single Cloudinary storage for both images and videos.
const mediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.fieldname === 'video';

    return {
      folder: isVideo ? 'ecommerce/videos' : 'ecommerce/images',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo
        ? ['mp4', 'webm', 'ogg', 'mov']
        : ['jpg', 'jpeg', 'png', 'webp', 'gif']
    };
  }
});

// Upload handler for both image and video fields.
const mediaUpload = multer({
  storage: mediaStorage,
  limits: { fileSize: 100 * 1024 * 1024, files: 9 },
  fileFilter: (req, file, cb) => {
    if ((file.fieldname === 'image' || file.fieldname === 'images') && imageMimes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    if (file.fieldname === 'video' && videoMimes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error('Only supported image/video files are allowed'));
  }
});

router.post(
  '/media',
  protect,
  authorize('seller', 'admin'),
  mediaUpload.fields([
    { name: 'images', maxCount: 8 },
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const imageFiles = [...(req.files?.images || []), ...(req.files?.image || [])];
      const videoFile = req.files?.video?.[0];

      if (imageFiles.length === 0 && !videoFile) {
        return res.status(400).json({
          success: false,
          message: 'Please upload at least one media file'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          image: imageFiles[0]?.path || imageFiles[0]?.secure_url || '',
          images: imageFiles.map((file) => file.path || file.secure_url).filter(Boolean),
          video: videoFile?.path || videoFile?.secure_url || ''
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;

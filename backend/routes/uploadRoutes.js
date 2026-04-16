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

// Cloudinary storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/images',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
  }
});

// Cloudinary storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'webm', 'ogg', 'mov']
  }
});

// Upload handler for images
const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if ((file.fieldname === 'image' || file.fieldname === 'images') && imageMimes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only supported image files are allowed'));
  }
});

// Upload handler for videos
const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video' && videoMimes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only supported video files are allowed'));
  }
});

router.post(
  '/media',
  protect,
  authorize('seller', 'admin'),
  imageUpload.fields([
    { name: 'images', maxCount: 8 },
    { name: 'image', maxCount: 1 }
  ]),
  videoUpload.single('video'),
  (req, res) => {
    try {
      const imageFiles = [...(req.files?.images || []), ...(req.files?.image || [])];
      const videoFile = req.files?.video;

      if (imageFiles.length === 0 && !videoFile) {
        return res.status(400).json({
          success: false,
          message: 'Please upload at least one media file'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          image: imageFiles[0]?.secure_url || '',
          images: imageFiles.map((file) => file.secure_url),
          video: videoFile?.secure_url || ''
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

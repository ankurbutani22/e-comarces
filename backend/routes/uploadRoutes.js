const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
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

// Upload handler for both image and video fields.
const mediaUpload = multer({
  storage: multer.memoryStorage(),
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

const uploadBufferToCloudinary = (file, options) => new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
    if (error) {
      reject(error);
      return;
    }
    resolve(result);
  });

  uploadStream.end(file.buffer);
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
  async (req, res) => {
    try {
      const imageFiles = [...(req.files?.images || []), ...(req.files?.image || [])];
      const videoFile = req.files?.video?.[0];

      if (imageFiles.length === 0 && !videoFile) {
        return res.status(400).json({
          success: false,
          message: 'Please upload at least one media file'
        });
      }

      const uploadedImages = await Promise.all(
        imageFiles.map((file) =>
          uploadBufferToCloudinary(file, {
            folder: 'ecommerce/images',
            resource_type: 'image'
          })
        )
      );

      let uploadedVideo = null;
      if (videoFile) {
        uploadedVideo = await uploadBufferToCloudinary(videoFile, {
          folder: 'ecommerce/videos',
          resource_type: 'video'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          image: uploadedImages[0]?.secure_url || '',
          images: uploadedImages.map((file) => file.secure_url).filter(Boolean),
          video: uploadedVideo?.secure_url || ''
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

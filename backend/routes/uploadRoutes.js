const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const ensureDir = (target) => {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
};

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const imageDir = path.join(uploadsRoot, 'images');
const videoDir = path.join(uploadsRoot, 'videos');
ensureDir(imageDir);
ensureDir(videoDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, videoDir);
      return;
    }
    cb(null, imageDir);
  },
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${unique}${safeExt}`);
  }
});

const imageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const videoMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
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
  upload.fields([
    { name: 'images', maxCount: 8 },
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  (req, res) => {
    const imageFiles = [...(req.files?.images || []), ...(req.files?.image || [])];
    const videoFile = req.files?.video?.[0];

    if (imageFiles.length === 0 && !videoFile) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one media file'
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.status(200).json({
      success: true,
      data: {
        image: imageFiles[0] ? `${baseUrl}/uploads/images/${imageFiles[0].filename}` : '',
        images: imageFiles.map((file) => `${baseUrl}/uploads/images/${file.filename}`),
        video: videoFile ? `${baseUrl}/uploads/videos/${videoFile.filename}` : ''
      }
    });
  }
);

module.exports = router;

const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mkv', 'video/mov', 'video/webm'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const videoUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `raw-videos/${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Allowed: MP4, MKV, MOV, WebM'), false);
    }
  },
});

const imageUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `thumbnails/${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Allowed: JPEG, PNG, WebP'), false);
    }
  },
});

module.exports = { videoUpload, imageUpload };
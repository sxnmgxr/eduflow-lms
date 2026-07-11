const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/s3');
const { query } = require('../config/db');

/**
 * Generate a signed URL for HLS master playlist
 * (Expires in 6 hours for authenticated users)
 */
const getVideoStreamUrl = async (lessonId, userId) => {
  // Check enrollment
  const { rows: lesson } = await query(
    'SELECT l.hls_key, l.is_preview, l.course_id FROM lessons l WHERE l.id = $1',
    [lessonId]
  );

  if (!lesson.length) throw new Error('Lesson not found');

  const { hls_key, is_preview, course_id } = lesson[0];

  if (!is_preview) {
    const { rows: enrollment } = await query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, course_id]
    );
    if (!enrollment.length) throw new Error('Not enrolled in this course');
  }

  if (!hls_key) throw new Error('Video not processed yet');

  // Generate signed URL for HLS playlist (valid 6 hours)
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: hls_key,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 21600 });
  return signedUrl;
};

/**
 * Get a presigned URL for direct video upload from client
 */
const getUploadPresignedUrl = async (fileName, fileType) => {
  const key = `raw-videos/${Date.now()}-${fileName.replace(/\s/g, '-')}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return { uploadUrl, key };
};

module.exports = { getVideoStreamUrl, getUploadPresignedUrl };
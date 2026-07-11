const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { query } = require('../config/db');
const { videoQueue } = require('../config/queue');
const { getVideoStreamUrl, getUploadPresignedUrl } = require('../services/video.service');

// Get lesson content (with enrollment check)
router.get('/:id/watch', protect, async (req, res) => {
  try {
    const streamUrl = await getVideoStreamUrl(req.params.id, req.user.id);
    res.json({ streamUrl });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
});

// Get presigned upload URL (instructor/admin)
router.post('/upload-url', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const result = await getUploadPresignedUrl(fileName, fileType);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create lesson
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const {
      section_id, course_id, title, description,
      position = 0, type = 'video', video_key,
      duration_seconds = 0, is_preview = false, content
    } = req.body;

    const { rows } = await query(`
      INSERT INTO lessons 
        (section_id, course_id, title, description, position,
         type, video_key, duration_seconds, is_preview, content)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [section_id, course_id, title, description, position,
        type, video_key, duration_seconds, is_preview, content]);

    res.status(201).json({ lesson: rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update lesson progress
router.post('/:id/progress', protect, async (req, res) => {
  try {
    const { watched_seconds, is_completed = false, course_id } = req.body;

    await query(`
      INSERT INTO lesson_progress (user_id, lesson_id, course_id, watched_seconds, is_completed, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET
        watched_seconds = GREATEST(lesson_progress.watched_seconds, EXCLUDED.watched_seconds),
        is_completed = EXCLUDED.is_completed,
        completed_at = CASE WHEN EXCLUDED.is_completed THEN NOW() ELSE lesson_progress.completed_at END
    `, [req.user.id, req.params.id, course_id, watched_seconds, is_completed,
        is_completed ? new Date() : null]);

    // Recalculate course progress
    if (is_completed) {
      await query(`
        UPDATE enrollments SET
          progress_percent = (
            SELECT ROUND(
              COUNT(lp.id) * 100.0 / NULLIF(COUNT(l.id), 0)
            )
            FROM lessons l
            LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id 
              AND lp.user_id = $1 AND lp.is_completed = TRUE
            WHERE l.course_id = $2 AND l.is_published = TRUE
          )
        WHERE user_id = $1 AND course_id = $2
      `, [req.user.id, course_id]);
    }

    res.json({ message: 'Progress updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update lesson
router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const updates = req.body
    const fields = Object.keys(updates).filter(k =>
      ['title', 'description', 'position', 'type', 'video_key', 'hls_key',
       'duration_seconds', 'is_preview', 'is_published', 'content'].includes(k)
    )
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')
    const values = fields.map(f => updates[f])

    const { rows } = await query(
      `UPDATE lessons SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...values]
    )
    res.json({ lesson: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete lesson
router.delete('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    await query('DELETE FROM lessons WHERE id = $1', [req.params.id])
    res.json({ message: 'Lesson deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Mark video as processed (called after FFmpeg transcoding completes)
router.patch('/:id/processed', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { hls_key, duration_seconds } = req.body
    const { rows } = await query(
      'UPDATE lessons SET hls_key = $1, duration_seconds = $2, is_published = TRUE WHERE id = $3 RETURNING *',
      [hls_key, duration_seconds, req.params.id]
    )
    res.json({ lesson: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Queue video for transcoding (called after S3 upload completes)
router.post('/transcode', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { lessonId, videoKey } = req.body

    const job = await videoQueue.add({
      lessonId,
      videoKey,
    }, {
      priority: 1,
    })

    res.json({
      message: 'Video queued for processing',
      jobId: job.id,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Check transcoding job status
router.get('/transcode/:jobId/status', protect, async (req, res) => {
  try {
    const { videoQueue } = require('../config/queue')
    const job = await videoQueue.getJob(req.params.jobId)

    if (!job) return res.status(404).json({ message: 'Job not found' })

    const state = await job.getState()
    const progress = job._progress

    res.json({
      jobId: job.id,
      state,
      progress,
      result: job.returnvalue,
      failedReason: job.failedReason,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Mark video as processed — called by worker
router.patch('/:id/processed', async (req, res) => {
  try {
    const workerSecret = req.headers['x-worker-secret']
    if (workerSecret !== (process.env.WORKER_SECRET || 'worker_secret_123')) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { hls_key, duration_seconds } = req.body
    const { rows } = await query(
      `UPDATE lessons
       SET hls_key = $1, duration_seconds = $2, is_published = TRUE, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [hls_key, duration_seconds, req.params.id]
    )

    if (!rows.length) return res.status(404).json({ message: 'Lesson not found' })

    // Update course total duration
    await query(`
      UPDATE courses SET
        duration_seconds = (
          SELECT COALESCE(SUM(duration_seconds), 0)
          FROM lessons WHERE course_id = $1 AND is_published = TRUE
        ),
        total_lessons = (
          SELECT COUNT(*) FROM lessons
          WHERE course_id = $1 AND is_published = TRUE
        )
      WHERE id = $1
    `, [rows[0].course_id])

    console.log(`[API] Lesson ${req.params.id} marked as processed`)
    res.json({ lesson: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


module.exports = router;
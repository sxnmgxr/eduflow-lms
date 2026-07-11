const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { query } = require('../config/db')

// Create live class
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const {
      course_id, title, description, platform,
      meeting_url, meeting_id, passcode,
      scheduled_at, duration_minutes
    } = req.body

    const { rows } = await query(`
      INSERT INTO live_classes
        (course_id, instructor_id, title, description, platform,
         meeting_url, meeting_id, passcode, scheduled_at, duration_minutes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [course_id, req.user.id, title, description, platform,
        meeting_url, meeting_id, passcode, scheduled_at, duration_minutes])

    res.status(201).json({ liveClass: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get live classes for a course
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT lc.*, u.name AS instructor_name
      FROM live_classes lc
      JOIN users u ON u.id = lc.instructor_id
      WHERE lc.course_id = $1
      ORDER BY lc.scheduled_at ASC
    `, [req.params.courseId])
    res.json({ liveClasses: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get upcoming live classes (student)
router.get('/upcoming', protect, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT lc.*, c.title AS course_title, u.name AS instructor_name
      FROM live_classes lc
      JOIN courses c ON c.id = lc.course_id
      JOIN users u ON u.id = lc.instructor_id
      JOIN enrollments e ON e.course_id = lc.course_id
      WHERE e.user_id = $1
        AND lc.scheduled_at > NOW()
        AND lc.status = 'scheduled'
      ORDER BY lc.scheduled_at ASC
      LIMIT 10
    `, [req.user.id])
    res.json({ liveClasses: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update live class (add recording)
router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { recording_url, status, title, description, scheduled_at } = req.body
    const { rows } = await query(`
      UPDATE live_classes SET
        recording_url = COALESCE($1, recording_url),
        status = COALESCE($2, status),
        title = COALESCE($3, title),
        description = COALESCE($4, description),
        scheduled_at = COALESCE($5, scheduled_at),
        is_recorded = CASE WHEN $1 IS NOT NULL THEN TRUE ELSE is_recorded END
      WHERE id = $6
      RETURNING *
    `, [recording_url, status, title, description, scheduled_at, req.params.id])
    res.json({ liveClass: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete
router.delete('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    await query('DELETE FROM live_classes WHERE id = $1', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
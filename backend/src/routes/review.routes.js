const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { query } = require('../config/db')
const redis = require('../config/redis')

// Add review
router.post('/', protect, async (req, res) => {
  try {
    const { course_id, rating, comment } = req.body

    // Must be enrolled
    const { rows: enrolled } = await query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, course_id]
    )
    if (!enrolled.length)
      return res.status(403).json({ message: 'You must be enrolled to review' })

    await query(
      `INSERT INTO reviews (user_id, course_id, rating, comment)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, course_id)
       DO UPDATE SET rating = $3, comment = $4`,
      [req.user.id, course_id, rating, comment]
    )

    // Recalculate avg rating
    await query(`
      UPDATE courses SET
        rating_avg = (SELECT AVG(rating) FROM reviews WHERE course_id = $1),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE course_id = $1)
      WHERE id = $1
    `, [course_id])

    // Invalidate cache
    const { rows: course } = await query('SELECT slug FROM courses WHERE id = $1', [course_id])
    if (course.length) await redis.del(`course:${course[0].slug}`)

    res.json({ message: 'Review submitted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get reviews for a course
router.get('/:courseId', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT r.*, u.name AS user_name, u.avatar_url
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.course_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.courseId])
    res.json({ reviews: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
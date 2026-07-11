const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { query } = require('../config/db');

// Enroll in a course
router.post('/', protect, async (req, res) => {
  try {
    const { course_id } = req.body

    const { rows: courses } = await query(
      'SELECT id, price, is_free, title FROM courses WHERE id = $1',
      [course_id]
    )
    if (!courses.rows?.length && !courses.length)
      return res.status(404).json({ message: 'Course not found' })

    const course = courses[0]

    // Paid course — return payment required
    if (!course.is_free && course.price > 0) {
      return res.status(402).json({
        message: 'Payment required',
        requiresPayment: true,
        price: course.price,
        course_id,
      })
    }

    await query(
      'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, course_id]
    )

    await query(
      'UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = $1',
      [course_id]
    )

    res.json({ message: 'Enrolled successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
// Get my enrollments
router.get('/my', protect, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT e.*, c.title, c.slug, c.thumbnail_url, c.level,
             c.total_lessons, u.name AS instructor_name
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      JOIN users u ON u.id = c.instructor_id
      WHERE e.user_id = $1
      ORDER BY e.enrolled_at DESC
    `, [req.user.id]);

    res.json({ enrollments: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
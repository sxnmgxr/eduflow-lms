const router = require('express').Router()
const { query } = require('../config/db')

router.get('/', async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.trim().length < 2)
      return res.json({ courses: [], users: [] })

    const term = `%${q.trim()}%`

    const [courses, instructors] = await Promise.all([
      query(`
        SELECT c.id, c.title, c.slug, c.thumbnail_url, c.level,
               c.rating_avg, c.enrolled_count, c.is_free, c.price,
               u.name AS instructor_name
        FROM courses c
        JOIN users u ON u.id = c.instructor_id
        WHERE c.is_published = TRUE
          AND (c.title ILIKE $1 OR c.short_description ILIKE $1
               OR $2 = ANY(c.tags))
        ORDER BY c.enrolled_count DESC
        LIMIT 8
      `, [term, q.trim().toLowerCase()]),

      query(`
        SELECT id, name, avatar_url, bio
        FROM users
        WHERE role = 'instructor' AND name ILIKE $1
        LIMIT 4
      `, [term]),
    ])

    res.json({ courses: courses.rows, instructors: instructors.rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
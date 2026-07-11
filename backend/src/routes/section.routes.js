const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { query } = require('../config/db')
const redis = require('../config/redis')

// Create section
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { course_id, title, position } = req.body

    // Verify ownership
    if (req.user.role !== 'admin') {
      const { rows } = await query('SELECT instructor_id FROM courses WHERE id = $1', [course_id])
      if (!rows.length || rows[0].instructor_id !== req.user.id)
        return res.status(403).json({ message: 'Not authorized' })
    }

    let pos = position
    if (pos === undefined) {
      const { rows } = await query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM sections WHERE course_id = $1',
        [course_id]
      )
      pos = rows[0].next
    }

    const { rows } = await query(
      'INSERT INTO sections (course_id, title, position) VALUES ($1,$2,$3) RETURNING *',
      [course_id, title, pos]
    )

    res.status(201).json({ section: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update section
router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { title, position } = req.body
    const { rows } = await query(
      'UPDATE sections SET title = COALESCE($1, title), position = COALESCE($2, position) WHERE id = $3 RETURNING *',
      [title, position, req.params.id]
    )
    res.json({ section: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete section
router.delete('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    await query('DELETE FROM sections WHERE id = $1', [req.params.id])
    res.json({ message: 'Section deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Reorder sections (bulk)
router.put('/reorder/bulk', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { sections } = req.body // [{id, position}]
    for (const s of sections) {
      await query('UPDATE sections SET position = $1 WHERE id = $2', [s.position, s.id])
    }
    res.json({ message: 'Reordered' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

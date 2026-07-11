const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { query } = require('../config/db')
const slugify = require('slugify')

// Get all published blogs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, tag } = req.query
    const offset = (page - 1) * limit
    let conditions = ['b.is_published = TRUE']
    let params = []
    let idx = 1

    if (tag) {
      conditions.push(`$${idx++} = ANY(b.tags)`)
      params.push(tag)
    }

    const where = `WHERE ${conditions.join(' AND ')}`
    const { rows } = await query(`
      SELECT b.*, u.name AS author_name, u.avatar_url AS author_avatar
      FROM blogs b
      LEFT JOIN users u ON u.id = b.author_id
      ${where}
      ORDER BY b.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset])

    const { rows: count } = await query(
      `SELECT COUNT(*) FROM blogs b ${where}`, params
    )

    res.json({ blogs: rows, total: parseInt(count[0].count) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get single blog
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT b.*, u.name AS author_name, u.avatar_url AS author_avatar
      FROM blogs b
      LEFT JOIN users u ON u.id = b.author_id
      WHERE b.slug = $1 AND b.is_published = TRUE
    `, [req.params.slug])

    if (!rows.length) return res.status(404).json({ message: 'Blog not found' })

    // Increment views
    await query('UPDATE blogs SET views = views + 1 WHERE slug = $1', [req.params.slug])

    res.json({ blog: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Create blog (admin/instructor)
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { title, content, excerpt, thumbnail_url, tags, is_published } = req.body
    let slug = slugify(title, { lower: true, strict: true })
    const existing = await query('SELECT id FROM blogs WHERE slug LIKE $1', [`${slug}%`])
    if (existing.rows.length) slug = `${slug}-${Date.now()}`

    const { rows } = await query(`
      INSERT INTO blogs (author_id, title, slug, content, excerpt, thumbnail_url, tags, is_published)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `, [req.user.id, title, slug, content, excerpt, thumbnail_url, tags || [], is_published || false])

    res.status(201).json({ blog: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update
router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { title, content, excerpt, thumbnail_url, tags, is_published } = req.body
    const { rows } = await query(`
      UPDATE blogs SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        excerpt = COALESCE($3, excerpt),
        thumbnail_url = COALESCE($4, thumbnail_url),
        tags = COALESCE($5, tags),
        is_published = COALESCE($6, is_published),
        updated_at = NOW()
      WHERE id = $7 RETURNING *
    `, [title, content, excerpt, thumbnail_url, tags, is_published, req.params.id])
    res.json({ blog: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await query('DELETE FROM blogs WHERE id = $1', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
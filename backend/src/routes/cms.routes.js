const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { query } = require('../config/db')
const { sendBulkEmail } = require('../services/email.service')

// ── EVENTS ───────────────────────────────────────────────────
router.get('/events', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM events WHERE is_published = TRUE ORDER BY event_date ASC'
    )
    res.json({ events: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/events', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, description, event_date, end_date, location, meeting_url, type, thumbnail_url, is_published } = req.body
    const { rows } = await query(`
      INSERT INTO events (title, description, event_date, end_date, location, meeting_url, type, thumbnail_url, is_published)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [title, description, event_date, end_date, location, meeting_url, type || 'online', thumbnail_url, is_published || false])
    res.status(201).json({ event: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/events/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const fields = ['title','description','event_date','end_date','location','meeting_url','type','thumbnail_url','is_published']
    const updates = Object.keys(req.body).filter(k => fields.includes(k))
    const setClause = updates.map((f, i) => `${f} = $${i + 2}`).join(', ')
    const { rows } = await query(
      `UPDATE events SET ${setClause} WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(f => req.body[f])]
    )
    res.json({ event: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/events/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await query('DELETE FROM events WHERE id = $1', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── TESTIMONIALS ─────────────────────────────────────────────
router.get('/testimonials', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM testimonials WHERE is_approved = TRUE ORDER BY created_at DESC'
    )
    res.json({ testimonials: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/testimonials', async (req, res) => {
  try {
    const { name, role, content, rating, avatar_url } = req.body
    const { rows } = await query(`
      INSERT INTO testimonials (name, role, content, rating, avatar_url)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [name, role, content, rating || 5, avatar_url])
    res.status(201).json({ testimonial: rows[0], message: 'Submitted for review' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/testimonials/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(
      'UPDATE testimonials SET is_approved = NOT is_approved WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    res.json({ testimonial: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/testimonials/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await query('DELETE FROM testimonials WHERE id = $1', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── NEWSLETTER ───────────────────────────────────────────────
router.post('/newsletter/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body
    await query(
      `INSERT INTO newsletter_subscribers (email, name)
       VALUES ($1,$2)
       ON CONFLICT (email) DO UPDATE SET is_active = TRUE`,
      [email, name]
    )
    res.json({ message: 'Subscribed successfully!' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/newsletter/unsubscribe', async (req, res) => {
  try {
    await query(
      'UPDATE newsletter_subscribers SET is_active = FALSE WHERE email = $1',
      [req.body.email]
    )
    res.json({ message: 'Unsubscribed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Send bulk newsletter (admin)
router.post('/newsletter/send', protect, authorize('admin'), async (req, res) => {
  try {
    const { subject, body } = req.body
    const { rows } = await query(
      'SELECT email, name FROM newsletter_subscribers WHERE is_active = TRUE'
    )

    // Send in background
    sendBulkEmail(rows.map(s => s.email), subject, body)
      .then(() => console.log(`Newsletter sent to ${rows.length} subscribers`))
      .catch(console.error)

    res.json({ message: `Sending newsletter to ${rows.length} subscribers` })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/newsletter/subscribers', protect, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC'
    )
    res.json({ subscribers: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── CONSULTATIONS ────────────────────────────────────────────
router.post('/consultations', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body
    const { rows } = await query(`
      INSERT INTO consultations (name, email, phone, subject, message)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [name, email, phone, subject, message])
    res.status(201).json({ message: 'Consultation request submitted!', id: rows[0].id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/consultations', protect, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM consultations ORDER BY created_at DESC'
    )
    res.json({ consultations: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/consultations/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body
    const { rows } = await query(
      'UPDATE consultations SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )
    res.json({ consultation: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
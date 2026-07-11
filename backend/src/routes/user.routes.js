const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { query } = require('../config/db')
const bcrypt = require('bcryptjs')
const { imageUpload } = require('../middleware/upload.middleware')

// Get my profile
router.get('/me', protect, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, role, avatar_url, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    res.json({ user: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update profile
router.put('/me', protect, imageUpload.single('avatar'), async (req, res) => {
  try {
    const { name, bio } = req.body
    const avatar_url = req.file?.location || req.user.avatar_url

    const { rows } = await query(
      `UPDATE users SET name=$1, bio=$2, avatar_url=$3, updated_at=NOW()
       WHERE id=$4 RETURNING id, name, email, role, avatar_url, bio`,
      [name, bio, avatar_url, req.user.id]
    )
    res.json({ user: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Change password
router.put('/me/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const { rows } = await query(
      'SELECT password_hash FROM users WHERE id = $1', [req.user.id]
    )
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash)
    if (!isMatch)
      return res.status(400).json({ message: 'Current password is incorrect' })

    const hash = await bcrypt.hash(newPassword, 12)
    await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id])

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    )
    res.json({ notifications: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Mark notification as read
router.patch('/notifications/:id/read', protect, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    )
    res.json({ message: 'Marked as read' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Mark all notifications read
router.patch('/notifications/read-all', protect, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read=TRUE WHERE user_id=$1', [req.user.id]
    )
    res.json({ message: 'All marked as read' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
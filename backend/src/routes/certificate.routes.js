const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { query } = require('../config/db')
const { generateCertificate } = require('../services/certificate.service')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { GetObjectCommand } = require('@aws-sdk/client-s3')
const s3 = require('../config/s3')

// Generate or retrieve certificate
router.post('/generate', protect, async (req, res) => {
  try {
    const { course_id } = req.body

    // Check enrollment and completion
    const { rows: enrollments } = await query(
      `SELECT e.*, c.title AS course_title, c.instructor_id,
              u.name AS instructor_name
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = c.instructor_id
       WHERE e.user_id = $1 AND e.course_id = $2`,
      [req.user.id, course_id]
    )

    if (!enrollments.length)
      return res.status(403).json({ message: 'You are not enrolled in this course' })

    const enrollment = enrollments[0]

    if (enrollment.progress_percent < 100)
      return res.status(400).json({
        message: 'Complete the course first to get your certificate',
        progress: enrollment.progress_percent,
      })

    // Check if cert already exists
    const { rows: existing } = await query(
      'SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2',
      [req.user.id, course_id]
    )

    if (existing.length) {
      // Return fresh signed URL
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: existing[0].s3_key,
        }),
        { expiresIn: 7 * 24 * 60 * 60 }
      )
      return res.json({ certificate_url: url, already_issued: true })
    }

    // Generate new certificate
    const { key, url } = await generateCertificate({
      studentName: req.user.name,
      courseName: enrollment.course_title,
      instructorName: enrollment.instructor_name,
      completedAt: enrollment.completed_at || new Date(),
      enrollmentId: enrollment.id,
    })

    // Save certificate record
    await query(
      `INSERT INTO certificates (user_id, course_id, enrollment_id, s3_key)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, course_id, enrollment.id, key]
    )

    // Update enrollment completed_at
    await query(
      'UPDATE enrollments SET completed_at = NOW() WHERE id = $1',
      [enrollment.id]
    )

    // Create notification
    await query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'certificate', '🎓 Certificate Earned!', $2)`,
      [req.user.id, `Congratulations! Your certificate for "${enrollment.course_title}" is ready.`]
    )

    res.json({ certificate_url: url, already_issued: false })
  } catch (err) {
    console.error('Certificate generation error:', err)
    res.status(500).json({ message: 'Failed to generate certificate' })
  }
})

// Get all my certificates
router.get('/my', protect, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT cert.*, c.title AS course_title,
             c.thumbnail_url, u.name AS instructor_name
      FROM certificates cert
      JOIN courses c ON c.id = cert.course_id
      JOIN users u ON u.id = c.instructor_id
      WHERE cert.user_id = $1
      ORDER BY cert.issued_at DESC
    `, [req.user.id])

    // Generate fresh signed URLs for each
    const certsWithUrls = await Promise.all(rows.map(async (cert) => {
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: cert.s3_key,
        }),
        { expiresIn: 7 * 24 * 60 * 60 }
      )
      return { ...cert, certificate_url: url }
    }))

    res.json({ certificates: certsWithUrls })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
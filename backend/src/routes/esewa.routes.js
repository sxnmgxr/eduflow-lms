const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { query } = require('../config/db')
const { getPaymentFormData, verifyPayment } = require('../services/esewa.service')
const { v4: uuidv4 } = require('uuid')

// Initiate eSewa payment
router.post('/initiate', protect, async (req, res) => {
  try {
    const { course_id } = req.body

    const { rows: courses } = await query(
      'SELECT * FROM courses WHERE id = $1 AND is_published = TRUE', [course_id]
    )
    if (!courses.length) return res.status(404).json({ message: 'Course not found' })

    const course = courses[0]
    if (course.is_free) return res.status(400).json({ message: 'Course is free' })

    // Check not already enrolled
    const { rows: enrolled } = await query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, course_id]
    )
    if (enrolled.length) return res.status(400).json({ message: 'Already enrolled' })

    const transactionId = `ESW-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`

    // Save pending payment
    await query(`
      INSERT INTO esewa_payments (user_id, course_id, amount, oid, status)
      VALUES ($1,$2,$3,$4,'pending')
    `, [req.user.id, course_id, course.price, transactionId])

    const formData = getPaymentFormData({
      amount: course.price,
      transactionId,
      successUrl: `${process.env.CLIENT_URL}/esewa/success`,
      failureUrl: `${process.env.CLIENT_URL}/esewa/failure`,
    })

    res.json(formData)
  } catch (err) {
    console.error('eSewa initiate error:', err.message)
    res.status(500).json({ message: 'Payment initiation failed' })
  }
})

// Verify eSewa payment (success callback)
router.post('/verify', protect, async (req, res) => {
  try {
    const { transaction_uuid, total_amount } = req.body

    // Get our payment record
    const { rows: payments } = await query(
      'SELECT * FROM esewa_payments WHERE oid = $1 AND user_id = $2',
      [transaction_uuid, req.user.id]
    )
    if (!payments.length) return res.status(404).json({ message: 'Payment not found' })

    const payment = payments[0]
    if (payment.status === 'completed') return res.json({ message: 'Already verified', enrolled: true })

    // Verify with eSewa
    const verification = await verifyPayment(transaction_uuid, total_amount)

    if (verification.status === 'COMPLETE') {
      await query(
        `UPDATE esewa_payments SET status='completed', ref_id=$1, verified_at=NOW() WHERE oid=$2`,
        [verification.ref_id || transaction_uuid, transaction_uuid]
      )

      // Enroll student
      await query(
        'INSERT INTO enrollments (user_id, course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [payment.user_id, payment.course_id]
      )
      await query('UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = $1', [payment.course_id])

      await query(
        `INSERT INTO notifications (user_id, type, title, message) VALUES ($1,'payment','eSewa Payment Confirmed!','You are now enrolled in the course.')`,
        [payment.user_id]
      )

      res.json({ message: 'Payment verified! Enrolled successfully.', enrolled: true })
    } else {
      await query("UPDATE esewa_payments SET status='failed' WHERE oid=$1", [transaction_uuid])
      res.status(400).json({ message: 'Payment not complete', status: verification.status })
    }
  } catch (err) {
    console.error('eSewa verify error:', err.message)
    res.status(500).json({ message: 'Verification failed' })
  }
})

module.exports = router
const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { query } = require('../config/db')

// Admin: create installment plan for a course
router.post('/plans', protect, authorize('admin'), async (req, res) => {
  try {
    const { course_id, total_amount, installments, interval_days } = req.body
    const { rows } = await query(`
      INSERT INTO installment_plans (course_id, total_amount, installments, interval_days)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [course_id, total_amount, installments, interval_days || 30])
    res.status(201).json({ plan: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get installment plan for a course
router.get('/plans/:courseId', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM installment_plans WHERE course_id = $1 AND is_active = TRUE',
      [req.params.courseId]
    )
    res.json({ plan: rows[0] || null })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Student: enroll via installment
router.post('/enroll', protect, async (req, res) => {
  try {
    const { plan_id } = req.body

    const { rows: plans } = await query(
      'SELECT * FROM installment_plans WHERE id = $1 AND is_active = TRUE', [plan_id]
    )
    if (!plans.length) return res.status(404).json({ message: 'Plan not found' })

    const plan = plans[0]
    const amountPerInstallment = (plan.total_amount / plan.installments).toFixed(2)
    const installments = []

    for (let i = 0; i < plan.installments; i++) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + i * plan.interval_days)

      const { rows } = await query(`
        INSERT INTO installment_payments (user_id, plan_id, course_id, installment_number, amount, due_date)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
      `, [req.user.id, plan_id, plan.course_id, i + 1, amountPerInstallment, dueDate.toISOString().split('T')[0]])
      installments.push(rows[0])
    }

    // Grant access after first installment is paid
    res.json({
      message: 'Installment plan started. Pay the first installment to access the course.',
      installments,
      first_due: installments[0],
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get my installments
router.get('/my', protect, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT ip.*, c.title AS course_title, ipl.installments AS total_installments
      FROM installment_payments ip
      JOIN courses c ON c.id = ip.course_id
      JOIN installment_plans ipl ON ipl.id = ip.plan_id
      WHERE ip.user_id = $1
      ORDER BY ip.course_id, ip.installment_number
    `, [req.user.id])
    res.json({ installments: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Mark installment as paid (admin)
router.patch('/:id/pay', protect, authorize('admin'), async (req, res) => {
  try {
    const { payment_method, payment_reference } = req.body
    const { rows } = await query(`
      UPDATE installment_payments SET
        status='paid', paid_at=NOW(), payment_method=$1, payment_reference=$2
      WHERE id=$3 RETURNING *
    `, [payment_method, payment_reference, req.params.id])

    const installment = rows[0]

    // If first installment paid, grant course access
    if (installment.installment_number === 1) {
      await query(
        'INSERT INTO enrollments (user_id, course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [installment.user_id, installment.course_id]
      )
    }

    res.json({ installment: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Admin: all installments
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT ip.*, u.name AS user_name, u.email AS user_email, c.title AS course_title
      FROM installment_payments ip
      JOIN users u ON u.id = ip.user_id
      JOIN courses c ON c.id = ip.course_id
      ORDER BY ip.due_date ASC
    `)
    res.json({ installments: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { query } = require('../config/db')
const { v4: uuidv4 } = require('uuid')

// Register as affiliate
router.post('/register', protect, async (req, res) => {
  try {
    const existing = await query('SELECT id FROM affiliates WHERE user_id = $1', [req.user.id])
    if (existing.rows.length)
      return res.status(400).json({ message: 'Already registered as affiliate' })

    const referralCode = req.user.name.split(' ')[0].toUpperCase() + uuidv4().split('-')[0].toUpperCase()

    const { rows } = await query(`
      INSERT INTO affiliates (user_id, referral_code, commission_rate)
      VALUES ($1,$2,10) RETURNING *
    `, [req.user.id, referralCode])

    res.status(201).json({ affiliate: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get my affiliate dashboard
router.get('/my', protect, async (req, res) => {
  try {
    const { rows: aff } = await query(
      'SELECT * FROM affiliates WHERE user_id = $1', [req.user.id]
    )
    if (!aff.length) return res.status(404).json({ message: 'Not registered as affiliate' })

    const { rows: referrals } = await query(`
      SELECT ar.*, u.name AS referred_name, c.title AS course_title
      FROM affiliate_referrals ar
      LEFT JOIN users u ON u.id = ar.referred_user_id
      LEFT JOIN courses c ON c.id = ar.course_id
      WHERE ar.affiliate_id = $1
      ORDER BY ar.created_at DESC
    `, [aff[0].id])

    const { rows: payouts } = await query(
      'SELECT * FROM affiliate_payouts WHERE affiliate_id = $1 ORDER BY requested_at DESC',
      [aff[0].id]
    )

    res.json({
      affiliate: aff[0],
      referrals,
      payouts,
      referralLink: `${process.env.CLIENT_URL}/register?ref=${aff[0].referral_code}`,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Track referral (called on registration with ref code)
router.post('/track', async (req, res) => {
  try {
    const { referral_code, referred_user_id, course_id } = req.body

    const { rows: aff } = await query(
      'SELECT * FROM affiliates WHERE referral_code = $1 AND is_active = TRUE',
      [referral_code]
    )
    if (!aff.length) return res.status(404).json({ message: 'Invalid referral code' })

    // Don't self-refer
    if (aff[0].user_id === referred_user_id)
      return res.status(400).json({ message: 'Cannot refer yourself' })

    const { rows } = await query(`
      INSERT INTO affiliate_referrals (affiliate_id, referred_user_id, course_id, commission_amount, status)
      VALUES ($1,$2,$3,0,'pending') RETURNING *
    `, [aff[0].id, referred_user_id, course_id || null])

    res.json({ referral: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Request payout
router.post('/payout', protect, async (req, res) => {
  try {
    const { method, reference } = req.body
    const { rows: aff } = await query(
      'SELECT * FROM affiliates WHERE user_id = $1', [req.user.id]
    )
    if (!aff.length) return res.status(404).json({ message: 'Not an affiliate' })
    if (aff[0].pending_earnings < 500)
      return res.status(400).json({ message: 'Minimum payout is NPR 500' })

    const { rows } = await query(`
      INSERT INTO affiliate_payouts (affiliate_id, amount, method, reference)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [aff[0].id, aff[0].pending_earnings, method, reference])

    // Reset pending
    await query(
      'UPDATE affiliates SET pending_earnings = 0 WHERE id = $1', [aff[0].id]
    )

    res.json({ payout: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Admin: all affiliates
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT a.*, u.name, u.email,
        (SELECT COUNT(*) FROM affiliate_referrals WHERE affiliate_id = a.id) AS total_referrals
      FROM affiliates a
      JOIN users u ON u.id = a.user_id
      ORDER BY a.total_earnings DESC
    `)
    res.json({ affiliates: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Admin: approve payout
router.patch('/payout/:id/pay', protect, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(`
      UPDATE affiliate_payouts SET status='paid', paid_at=NOW() WHERE id=$1 RETURNING *
    `, [req.params.id])

    // Update affiliate paid earnings
    await query(`
      UPDATE affiliates SET
        paid_earnings = paid_earnings + $1,
        total_earnings = total_earnings + $1
      WHERE id = $2
    `, [rows[0].amount, rows[0].affiliate_id])

    // Record as expense
    await query(`
      INSERT INTO income_expenses (type, category, title, amount, date)
      VALUES ('expense', 'Affiliate Payout', 'Affiliate Commission Payout', $1, CURRENT_DATE)
    `, [rows[0].amount])

    res.json({ payout: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
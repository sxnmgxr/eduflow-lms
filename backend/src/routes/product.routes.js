const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { query } = require('../config/db')
const slugify = require('slugify')
const { imageUpload } = require('../middleware/upload.middleware')
const { v4: uuidv4 } = require('uuid')

// Get all published products
router.get('/', async (req, res) => {
  try {
    const { category, type, page = 1, limit = 12, search } = req.query
    const offset = (page - 1) * limit
    let conditions = ['is_published = TRUE']
    let params = []
    let idx = 1

    if (category) { conditions.push(`category = $${idx++}`); params.push(category) }
    if (type) { conditions.push(`type = $${idx++}`); params.push(type) }
    if (search) {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`)
      params.push(`%${search}%`); idx++
    }

    const where = `WHERE ${conditions.join(' AND ')}`
    const { rows } = await query(
      `SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    )
    const { rows: count } = await query(`SELECT COUNT(*) FROM products ${where}`, params)

    res.json({ products: rows, total: parseInt(count[0].count) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get single product
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM products WHERE slug = $1 AND is_published = TRUE',
      [req.params.slug]
    )
    if (!rows.length) return res.status(404).json({ message: 'Product not found' })
    res.json({ product: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Create product (admin)
router.post('/', protect, authorize('admin'), imageUpload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, price, sale_price, category, type, stock, is_digital, is_published } = req.body
    let slug = slugify(title, { lower: true, strict: true })
    const existing = await query('SELECT id FROM products WHERE slug LIKE $1', [`${slug}%`])
    if (existing.rows.length) slug = `${slug}-${Date.now()}`

    const thumbnail_url = req.file?.location || null

    const { rows } = await query(`
      INSERT INTO products (title, slug, description, thumbnail_url, price, sale_price, category, type, stock, is_digital, is_published)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [title, slug, description, thumbnail_url, price, sale_price || null, category, type || 'book', stock || 0, is_digital === 'true', is_published === 'true'])

    res.status(201).json({ product: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update product
router.put('/:id', protect, authorize('admin'), imageUpload.single('thumbnail'), async (req, res) => {
  try {
    const fields = ['title','description','price','sale_price','category','type','stock','is_digital','is_published']
    const updates = Object.keys(req.body).filter(k => fields.includes(k))
    if (req.file) { updates.push('thumbnail_url'); req.body.thumbnail_url = req.file.location }

    const setClause = updates.map((f, i) => `${f} = $${i + 2}`).join(', ')
    const { rows } = await query(
      `UPDATE products SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(f => req.body[f])]
    )
    res.json({ product: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete product
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await query('DELETE FROM products WHERE id = $1', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Create order
router.post('/orders/create', protect, async (req, res) => {
  try {
    const { items, payment_method, shipping_address, notes, referral_code } = req.body
    // items: [{product_id, quantity}]

    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const { rows: products } = await query(
        'SELECT * FROM products WHERE id = $1 AND is_published = TRUE', [item.product_id]
      )
      if (!products.length) return res.status(404).json({ message: `Product not found: ${item.product_id}` })
      const product = products[0]
      const price = product.sale_price || product.price
      subtotal += price * item.quantity
      orderItems.push({ product_id: item.product_id, quantity: item.quantity, unit_price: price, total_price: price * item.quantity })
    }

    // Handle referral discount
    let discount = 0
    let affiliateId = null
    if (referral_code) {
      const { rows: aff } = await query(
        'SELECT * FROM affiliates WHERE referral_code = $1 AND is_active = TRUE', [referral_code]
      )
      if (aff.length) {
        affiliateId = aff[0].id
        discount = (subtotal * aff[0].commission_rate) / 100
      }
    }

    const orderNumber = `ORD-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`
    const total = subtotal - discount

    const { rows: order } = await query(`
      INSERT INTO orders (user_id, order_number, status, subtotal, discount, total, payment_method, shipping_address, notes)
      VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,$8) RETURNING *
    `, [req.user.id, orderNumber, subtotal, discount, total, payment_method, JSON.stringify(shipping_address || {}), notes])

    for (const item of orderItems) {
      await query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ($1,$2,$3,$4,$5)',
        [order[0].id, item.product_id, item.quantity, item.unit_price, item.total_price]
      )
      // Decrement stock
      await query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id])
    }

    // Track affiliate
    if (affiliateId) {
      const commission = (total * 10) / 100
      await query(`
        INSERT INTO affiliate_referrals (affiliate_id, referred_user_id, order_id, commission_amount, status)
        VALUES ($1,$2,$3,$4,'pending')
      `, [affiliateId, req.user.id, order[0].id, commission])
    }

    res.status(201).json({ order: order[0], orderNumber })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get my orders
router.get('/orders/my', protect, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT o.*,
        json_agg(json_build_object(
          'product_id', oi.product_id, 'quantity', oi.quantity,
          'unit_price', oi.unit_price, 'total_price', oi.total_price,
          'title', p.title, 'thumbnail_url', p.thumbnail_url
        )) AS items
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.user.id])
    res.json({ orders: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Admin: all orders
router.get('/orders/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT o.*, u.name AS user_name, u.email AS user_email,
        json_agg(json_build_object('title', p.title, 'quantity', oi.quantity)) AS items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
      LIMIT 100
    `)
    res.json({ orders: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update order status
router.patch('/orders/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, payment_status } = req.body
    const { rows } = await query(
      'UPDATE orders SET status = COALESCE($1,status), payment_status = COALESCE($2,payment_status), updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, payment_status, req.params.id]
    )
    res.json({ order: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
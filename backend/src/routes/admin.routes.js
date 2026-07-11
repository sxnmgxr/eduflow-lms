const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { query } = require('../config/db');

router.use(protect, authorize('admin'));

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [users, courses, enrollments, revenue] = await Promise.all([
      query('SELECT COUNT(*) FROM users WHERE role = $1', ['student']),
      query('SELECT COUNT(*) FROM courses'),
      query('SELECT COUNT(*) FROM enrollments'),
      query('SELECT COALESCE(SUM(c.price), 0) AS total FROM enrollments e JOIN courses c ON c.id = e.course_id'),
    ]);

    res.json({
      totalStudents: parseInt(users.rows[0].count),
      totalCourses: parseInt(courses.rows[0].count),
      totalEnrollments: parseInt(enrollments.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (role) { conditions.push(`role = $${idx++}`); params.push(role); }
    if (search) {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT id, name, email, role, is_active, created_at, avatar_url
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle user active status
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const { rows } = await query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
      [req.params.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manage categories
router.get('/categories', async (req, res) => {
  const { rows } = await query('SELECT * FROM categories ORDER BY name');
  res.json({ categories: rows });
});

router.post('/categories', async (req, res) => {
  const { name, description, icon } = req.body;
  const slugify = require('slugify');
  const slug = slugify(name, { lower: true, strict: true });
  const { rows } = await query(
    'INSERT INTO categories (name, slug, description, icon) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, slug, description, icon]
  );
  res.status(201).json({ category: rows[0] });
});

module.exports = router;
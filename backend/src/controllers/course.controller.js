const { query } = require('../config/db');
const slugify = require('slugify');
const redis = require('../config/redis');

const getAllCourses = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, category, level,
      search, sort = 'newest', is_free
    } = req.query;

    const offset = (page - 1) * limit;
    let conditions = ['c.is_published = TRUE'];
    let params = [];
    let idx = 1;

    if (category) {
      conditions.push(`cat.slug = $${idx++}`);
      params.push(category);
    }
    if (level) {
      conditions.push(`c.level = $${idx++}`);
      params.push(level);
    }
    if (is_free !== undefined) {
      conditions.push(`c.is_free = $${idx++}`);
      params.push(is_free === 'true');
    }
    if (search) {
      conditions.push(`(c.title ILIKE $${idx} OR c.short_description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortMap = {
      newest: 'c.created_at DESC',
      popular: 'c.enrolled_count DESC',
      rating: 'c.rating_avg DESC',
      price_low: 'c.price ASC',
      price_high: 'c.price DESC',
    };
    const orderBy = sortMap[sort] || 'c.created_at DESC';

    const coursesQuery = `
      SELECT c.*, 
             u.name AS instructor_name, u.avatar_url AS instructor_avatar,
             cat.name AS category_name, cat.slug AS category_slug
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      ${whereClause}
    `;

    params.push(limit, offset);
    const [coursesResult, countResult] = await Promise.all([
      query(coursesQuery, params),
      query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      courses: coursesResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCourseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Try cache first
    const cached = await redis.get(`course:${slug}`);
    if (cached) return res.json(JSON.parse(cached));

    const { rows } = await query(`
      SELECT c.*,
             u.name AS instructor_name, u.avatar_url AS instructor_avatar,
             u.bio AS instructor_bio,
             cat.name AS category_name
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.slug = $1 AND c.is_published = TRUE
    `, [slug]);

    if (!rows.length) return res.status(404).json({ message: 'Course not found' });

    const course = rows[0];

    // Fetch sections with lessons
    const sections = await query(`
      SELECT s.*, 
             json_agg(
               json_build_object(
                 'id', l.id, 'title', l.title, 'type', l.type,
                 'duration_seconds', l.duration_seconds, 'is_preview', l.is_preview,
                 'position', l.position
               ) ORDER BY l.position
             ) FILTER (WHERE l.id IS NOT NULL) AS lessons
      FROM sections s
      LEFT JOIN lessons l ON l.section_id = s.id AND l.is_published = TRUE
      WHERE s.course_id = $1
      GROUP BY s.id
      ORDER BY s.position
    `, [course.id]);

    course.sections = sections.rows;

    // Cache for 10 minutes
    await redis.setex(`course:${slug}`, 600, JSON.stringify(course));

    res.json(course);
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const {
      title, description, short_description,
      category_id, price = 0, is_free = false,
      level = 'beginner', language = 'English', tags = []
    } = req.body;

    let slug = slugify(title, { lower: true, strict: true });

    // Ensure unique slug
    const existing = await query('SELECT id FROM courses WHERE slug LIKE $1', [`${slug}%`]);
    if (existing.rows.length) slug = `${slug}-${Date.now()}`;

    const thumbnail_url = req.file?.location || null;

    const { rows } = await query(`
      INSERT INTO courses 
        (title, slug, description, short_description, thumbnail_url,
         instructor_id, category_id, price, is_free, level, language, tags)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `, [title, slug, description, short_description, thumbnail_url,
        req.user.id, category_id, price, is_free, level, language, tags]);

    res.status(201).json({ message: 'Course created', course: rows[0] });
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Ensure instructor owns the course (or admin)
    if (req.user.role !== 'admin') {
      const { rows } = await query('SELECT instructor_id FROM courses WHERE id = $1', [id]);
      if (!rows.length || rows[0].instructor_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    if (req.file) updates.thumbnail_url = req.file.location;

    const fields = Object.keys(updates).filter(k => 
      ['title','description','short_description','thumbnail_url','category_id',
       'price','is_free','level','language','tags','is_published'].includes(k)
    );

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map(f => updates[f]);

    const { rows } = await query(
      `UPDATE courses SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    // Invalidate cache
    await redis.del(`course:${rows[0].slug}`);

    res.json({ message: 'Course updated', course: rows[0] });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


const getMyCourses = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT c.*, cat.name AS category_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.instructor_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.id])
    res.json({ courses: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getAllCourses, getCourseBySlug, getMyCourses, createCourse, updateCourse, deleteCourse };

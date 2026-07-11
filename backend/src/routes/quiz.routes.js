const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { query } = require('../config/db')

// Create quiz
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const {
      course_id, lesson_id, title, description,
      duration_minutes, pass_percentage,
      max_attempts, shuffle_questions, show_results
    } = req.body

    const { rows } = await query(`
      INSERT INTO quizzes
        (course_id, lesson_id, title, description, duration_minutes,
         pass_percentage, max_attempts, shuffle_questions, show_results)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [course_id, lesson_id, title, description, duration_minutes,
        pass_percentage, max_attempts, shuffle_questions, show_results])

    res.status(201).json({ quiz: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Add question to quiz
router.post('/:id/questions', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { question, options, correct_answer, explanation, marks, position } = req.body

    const { rows } = await query(`
      INSERT INTO quiz_questions
        (quiz_id, question, options, correct_answer, explanation, marks, position)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [req.params.id, question, JSON.stringify(options),
        correct_answer, explanation, marks || 1, position || 0])

    res.status(201).json({ question: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get quiz with questions (instructor view)
router.get('/:id', protect, async (req, res) => {
  try {
    const { rows: quiz } = await query(
      'SELECT * FROM quizzes WHERE id = $1', [req.params.id]
    )
    if (!quiz.length) return res.status(404).json({ message: 'Quiz not found' })

    const { rows: questions } = await query(
      'SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY position',
      [req.params.id]
    )

    res.json({ quiz: quiz[0], questions })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get quiz for student (hides correct answers)
router.get('/:id/attempt', protect, async (req, res) => {
  try {
    const { rows: quiz } = await query(
      'SELECT * FROM quizzes WHERE id = $1 AND is_published = TRUE',
      [req.params.id]
    )
    if (!quiz.length) return res.status(404).json({ message: 'Quiz not found' })

    // Check enrollment
    const { rows: enrolled } = await query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, quiz[0].course_id]
    )
    if (!enrolled.length)
      return res.status(403).json({ message: 'Not enrolled in this course' })

    // Check attempt count
    const { rows: attempts } = await query(
      'SELECT COUNT(*) FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2',
      [req.user.id, req.params.id]
    )
    const attemptCount = parseInt(attempts[0].count)
    if (attemptCount >= quiz[0].max_attempts)
      return res.status(400).json({
        message: `Maximum attempts (${quiz[0].max_attempts}) reached`,
        attempts: attemptCount
      })

    let questionsQuery = `
      SELECT id, question, options, marks, position
      FROM quiz_questions WHERE quiz_id = $1
      ORDER BY position
    `
    const { rows: questions } = await query(questionsQuery, [req.params.id])

    // Shuffle if enabled
    let finalQuestions = questions
    if (quiz[0].shuffle_questions) {
      finalQuestions = [...questions].sort(() => Math.random() - 0.5)
    }

    res.json({
      quiz: quiz[0],
      questions: finalQuestions,
      attempt_number: attemptCount + 1,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Submit quiz
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { answers, time_taken_seconds } = req.body
    // answers: { questionId: selectedOptionIndex }

    const { rows: quiz } = await query(
      'SELECT * FROM quizzes WHERE id = $1', [req.params.id]
    )
    if (!quiz.length) return res.status(404).json({ message: 'Quiz not found' })

    const { rows: questions } = await query(
      'SELECT * FROM quiz_questions WHERE quiz_id = $1', [req.params.id]
    )

    // Calculate score
    let score = 0
    let totalMarks = 0
    const results = {}

    questions.forEach(q => {
      totalMarks += q.marks
      const userAnswer = answers[q.id]
      const isCorrect = userAnswer === q.correct_answer
      if (isCorrect) score += q.marks
      results[q.id] = {
        correct: isCorrect,
        correct_answer: q.correct_answer,
        user_answer: userAnswer,
        explanation: q.explanation,
      }
    })

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0
    const passed = percentage >= quiz[0].pass_percentage

    // Get attempt number
    const { rows: prevAttempts } = await query(
      'SELECT COUNT(*) FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2',
      [req.user.id, req.params.id]
    )
    const attemptNumber = parseInt(prevAttempts[0].count) + 1

    // Save attempt
    const { rows: attempt } = await query(`
      INSERT INTO quiz_attempts
        (quiz_id, user_id, answers, score, total_marks,
         percentage, passed, time_taken_seconds, submitted_at, attempt_number)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9)
      RETURNING *
    `, [req.params.id, req.user.id, JSON.stringify(answers),
        score, totalMarks, percentage.toFixed(2),
        passed, time_taken_seconds, attemptNumber])

    res.json({
      attempt: attempt[0],
      score,
      total_marks: totalMarks,
      percentage: percentage.toFixed(1),
      passed,
      results: quiz[0].show_results ? results : null,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get my attempts for a quiz
router.get('/:id/my-attempts', protect, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT * FROM quiz_attempts
      WHERE user_id = $1 AND quiz_id = $2
      ORDER BY attempt_number DESC
    `, [req.user.id, req.params.id])
    res.json({ attempts: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Publish/unpublish quiz
router.patch('/:id/publish', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { rows } = await query(
      'UPDATE quizzes SET is_published = NOT is_published WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    res.json({ quiz: rows[0] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get all quizzes for a course
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT q.*,
        (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
        (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND user_id = $2) AS my_attempts
      FROM quizzes q
      WHERE q.course_id = $1
      ORDER BY q.created_at DESC
    `, [req.params.courseId, req.user.id])
    res.json({ quizzes: rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete question
router.delete('/questions/:questionId', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    await query('DELETE FROM quiz_questions WHERE id = $1', [req.params.questionId])
    res.json({ message: 'Question deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
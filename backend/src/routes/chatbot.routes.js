const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { query } = require('../config/db')
const axios = require('axios')

// AI Chatbot using Claude API (Anthropic)
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body

    // Get user's enrolled courses for context
    const { rows: enrollments } = await query(`
      SELECT c.title FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = $1 LIMIT 5
    `, [req.user.id])

    const enrolledCourses = enrollments.map(e => e.title).join(', ')

    const systemPrompt = `You are EduFlow AI Assistant, a helpful learning assistant for the EduFlow LMS platform.

Student name: ${req.user.name}
Enrolled courses: ${enrolledCourses || 'None yet'}

Your role:
- Help students with course-related questions
- Explain concepts clearly and concisely
- Guide students to the right resources
- Answer questions about how to use EduFlow
- Be encouraging and supportive
- Keep responses focused and helpful

If asked about specific lesson content, remind students to check their course videos and materials.
If asked about payments or enrollment, guide them to the appropriate section.
Never share personal information about other students.`

    const messages = [
      ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ]

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    )

    const reply = response.data.content[0].text

    res.json({ reply, role: 'assistant' })
  } catch (err) {
    console.error('Chatbot error:', err.response?.data || err.message)
    res.status(500).json({
      reply: "I'm having trouble connecting right now. Please try again in a moment.",
      role: 'assistant'
    })
  }
})

module.exports = router
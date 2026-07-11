import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Clock, Award, ArrowRight, RotateCcw } from 'lucide-react'

export default function QuizAttempt() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [startTime] = useState(Date.now())
  const [submitted, setSubmitted] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['quiz-attempt', quizId],
    queryFn: () => api.get(`/quizzes/${quizId}/attempt`).then(r => r.data),
  })

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/quizzes/${quizId}/submit`, {
      answers,
      time_taken_seconds: Math.round((Date.now() - startTime) / 1000),
    }),
    onSuccess: ({ data }) => {
      setResult(data)
      setSubmitted(true)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Submission failed'),
  })

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return null

  const { quiz, questions } = data
  const answeredCount = Object.keys(answers).length

  // Results screen
  if (submitted && result) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="card p-10 max-w-lg w-full text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5
          ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
          {result.passed
            ? <Award size={40} className="text-green-600" />
            : <XCircle size={40} className="text-red-500" />
          }
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {result.passed ? 'Congratulations! 🎉' : 'Keep Trying!'}
        </h2>
        <p className="text-gray-500 mb-6">
          {result.passed ? 'You passed the quiz' : 'You did not meet the passing score'}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{result.score}</div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
          <div className={`rounded-xl p-4 ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
              {result.percentage}%
            </div>
            <div className="text-xs text-gray-500">Percentage</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{result.total_marks}</div>
            <div className="text-xs text-gray-500">Total Marks</div>
          </div>
        </div>

        {result.results && (
          <div className="text-left space-y-3 mb-8 max-h-80 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 text-sm">Answer Review</h3>
            {questions.map((q, i) => {
              const r = result.results[q.id]
              if (!r) return null
              return (
                <div key={q.id} className={`p-3 rounded-xl text-sm ${r.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="font-medium text-gray-800 mb-1">Q{i+1}. {q.question}</p>
                  <p className={r.correct ? 'text-green-700' : 'text-red-700'}>
                    Your answer: {q.options[r.user_answer] || 'Not answered'}
                    {r.correct ? ' ✓' : ` ✗ (Correct: ${q.options[r.correct_answer]})`}
                  </p>
                  {r.explanation && !r.correct && (
                    <p className="text-gray-500 text-xs mt-1">💡 {r.explanation}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary flex-1">Back to Course</button>
          {!result.passed && (
            <button onClick={() => { setSubmitted(false); setAnswers({}) }}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              <RotateCcw size={16} /> Retry
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-sm text-gray-500">
              {answeredCount}/{questions.length} answered
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              {quiz.duration_minutes} min
            </div>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || answeredCount === 0}
              className="btn-primary flex items-center gap-2">
              {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-3">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="card p-6">
            <div className="flex items-start gap-3 mb-5">
              <span className="flex-shrink-0 w-7 h-7 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-gray-900">{q.question}</p>
                <p className="text-xs text-gray-400 mt-1">{q.marks} mark{q.marks > 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="space-y-3 ml-10">
              {q.options.map((option, optIdx) => (
                <label key={optIdx}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${answers[q.id] === optIdx
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name={q.id}
                    value={optIdx}
                    checked={answers[q.id] === optIdx}
                    onChange={() => setAnswers({ ...answers, [q.id]: optIdx })}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || answeredCount === 0}
          className="btn-primary w-full py-3 text-base">
          {submitMutation.isPending ? 'Submitting...' : `Submit Quiz (${answeredCount}/${questions.length} answered)`}
        </button>
      </div>
    </div>
  )
}
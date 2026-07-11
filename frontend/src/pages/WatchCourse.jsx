import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import VideoPlayer from '../components/ui/VideoPlayer'
import { ChevronDown, Play, Lock, CheckCircle, ArrowLeft, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WatchCourse() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeLesson, setActiveLesson] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [expandedSection, setExpandedSection] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [review, setReview] = useState({ rating: 5, comment: '' })

  const { data: course } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get(`/courses/${slug}`).then(r => r.data),
  })

  const { data: progressData } = useQuery({
    queryKey: ['progress', course?.id],
    queryFn: () => api.get(`/enrollments/my`).then(r =>
      r.data.enrollments.find(e => e.course_id === course.id)
    ),
    enabled: !!course?.id,
  })

  // Auto-expand first section
  useEffect(() => {
    if (course?.sections?.length && !expandedSection) {
      setExpandedSection(course.sections[0].id)
    }
  }, [course])

  const loadLesson = async (lesson) => {
    try {
      const { data } = await api.get(`/lessons/${lesson.id}/watch`)
      setVideoUrl(data.streamUrl)
      setActiveLesson(lesson)
    } catch {
      toast.error('Please enroll in this course to watch lessons')
    }
  }

  const progressMutation = useMutation({
    mutationFn: ({ seconds, completed }) =>
      api.post(`/lessons/${activeLesson.id}/progress`, {
        watched_seconds: seconds,
        is_completed: completed,
        course_id: course.id,
      }),
    onSuccess: () => qc.invalidateQueries(['progress', course?.id]),
  })

  const reviewMutation = useMutation({
    mutationFn: () => api.post('/reviews', { course_id: course.id, ...review }),
    onSuccess: () => {
      toast.success('Review submitted!')
      setShowReviewForm(false)
      qc.invalidateQueries(['reviews', course?.id])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit'),
  })

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Left: Video + info */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-gray-800 px-5 py-3 flex items-center gap-4 border-b border-gray-700">
          <button onClick={() => navigate('/dashboard/my-courses')}
            className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-white font-semibold text-sm line-clamp-1">{course?.title}</p>
            {progressData && (
              <p className="text-gray-400 text-xs">{progressData.progress_percent}% complete</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            {progressData && (
              <div className="w-32 bg-gray-700 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progressData.progress_percent}%` }} />
              </div>
            )}
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
              <Star size={14} fill="currentColor" />
              Rate Course
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="flex-1 overflow-y-auto bg-black">
          {videoUrl ? (
            <VideoPlayer
              src={videoUrl}
              poster={course?.thumbnail_url}
              onProgress={(secs) => progressMutation.mutate({ seconds: secs, completed: false })}
              onComplete={() => {
                progressMutation.mutate({ seconds: activeLesson?.duration_seconds, completed: true })
                toast.success('Lesson completed! 🎉')
              }}
            />
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center text-gray-500">
              <Play size={56} className="opacity-20 mb-3" />
              <p className="text-sm">Select a lesson from the sidebar to start</p>
            </div>
          )}

          {/* Lesson info */}
          {activeLesson && (
            <div className="p-6 bg-gray-900">
              <h2 className="text-xl font-display font-bold text-white mb-2">{activeLesson.title}</h2>
              {activeLesson.description && (
                <p className="text-gray-400 text-sm">{activeLesson.description}</p>
              )}
            </div>
          )}

          {/* Review form */}
          {showReviewForm && (
            <div className="mx-6 mb-6 bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">Rate this course</h3>
              <div className="flex gap-2 mb-4">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReview(r => ({ ...r, rating: n }))}>
                    <Star size={28}
                      className={n <= review.rating ? 'text-yellow-400' : 'text-gray-600'}
                      fill={n <= review.rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Share your experience..."
                value={review.comment}
                onChange={(e) => setReview(r => ({ ...r, comment: e.target.value }))}
              />
              <div className="flex gap-3 mt-3">
                <button onClick={() => reviewMutation.mutate()}
                  disabled={reviewMutation.isPending}
                  className="btn-primary text-sm">
                  {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
                <button onClick={() => setShowReviewForm(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Curriculum sidebar */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Course Content</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {course?.total_lessons || 0} lessons
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {course?.sections?.map((section) => (
            <div key={section.id} className="border-b border-gray-700">
              <button
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-700/50 transition-colors"
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              >
                <span className="text-sm font-medium text-white line-clamp-1 flex-1 mr-2">
                  {section.title}
                </span>
                <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`} />
              </button>

              {expandedSection === section.id && (
                <div className="bg-gray-900/30">
                  {section.lessons?.map((lesson) => (
                    <button
                      key={lesson.id}
                      className={`w-full flex items-start gap-3 px-5 py-3 text-left transition-colors text-sm
                        ${activeLesson?.id === lesson.id
                          ? 'bg-indigo-600/20 border-l-2 border-indigo-500'
                          : 'hover:bg-gray-700/30 border-l-2 border-transparent'
                        }`}
                      onClick={() => loadLesson(lesson)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {lesson.is_preview
                          ? <Play size={13} className="text-indigo-400" />
                          : <Lock size={13} className="text-gray-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`line-clamp-2 ${activeLesson?.id === lesson.id ? 'text-indigo-300' : 'text-gray-300'}`}>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {Math.floor((lesson.duration_seconds || 0) / 60)}m
                        </p>
                      </div>
                      {lesson.is_completed && (
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
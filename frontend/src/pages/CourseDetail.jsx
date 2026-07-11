import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import Navbar from '../components/ui/Navbar'
import toast from 'react-hot-toast'
import {
  Star, Users, Clock, BookOpen, ChevronDown,
  Play, Lock, CheckCircle, Globe, BarChart2
} from 'lucide-react'

export default function CourseDetail() {
  const { slug } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(null)

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get(`/courses/${slug}`).then(r => r.data),
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', course?.id],
    queryFn: () => api.get(`/reviews/${course.id}`).then(r => r.data),
    enabled: !!course?.id,
  })

  const enrollMutation = useMutation({
    mutationFn: () => api.post('/enrollments', { course_id: course.id }),
    onSuccess: () => {
      toast.success('Enrolled! Happy learning 🎉')
      navigate('/dashboard/my-courses')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to enroll'),
  })

  const handleEnroll = () => {
    if (!user) return navigate('/login')
    enrollMutation.mutate()
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!course) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="text-center py-32 text-gray-400">Course not found</div>
    </div>
  )

  const totalLessons = course.sections?.reduce((a, s) => a + (s.lessons?.length || 0), 0) || 0
  const totalMins = Math.round((course.duration_seconds || 0) / 60)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-3 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge bg-indigo-500/20 text-indigo-300 text-xs">{course.category_name}</span>
              <span className="badge bg-white/10 text-gray-300 text-xs capitalize">{course.level}</span>
            </div>
            <h1 className="text-4xl font-display font-bold leading-tight mb-4">{course.title}</h1>
            <p className="text-gray-300 text-lg mb-6">{course.short_description}</p>

            <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-yellow-400" fill="currentColor" />
                <span className="text-white font-medium">{course.rating_avg?.toFixed(1) || '0.0'}</span>
                <span>({course.rating_count || 0} reviews)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={16} />
                <span>{course.enrolled_count?.toLocaleString() || 0} students</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} />
                <span>{totalMins} mins</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen size={16} />
                <span>{totalLessons} lessons</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {course.instructor_avatar
                ? <img src={course.instructor_avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                : <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">
                    {course.instructor_name?.charAt(0)}
                  </div>
              }
              <div>
                <p className="text-xs text-gray-400">Instructor</p>
                <p className="text-sm font-medium">{course.instructor_name}</p>
              </div>
            </div>
          </div>

          {/* Enroll card */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden sticky top-24">
              <img
                src={course.thumbnail_url || 'https://placehold.co/400x220?text=Course'}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="text-3xl font-display font-bold text-gray-900 mb-1">
                  {course.is_free ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `$${course.price}`
                  )}
                </div>
                <button
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                  className="btn-primary w-full text-base py-3 mt-4"
                >
                  {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">30-day money-back guarantee</p>

                <div className="mt-5 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Globe size={15} className="text-gray-400" />
                    <span>Language: {course.language}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart2 size={15} className="text-gray-400" />
                    <span className="capitalize">Level: {course.level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={15} className="text-gray-400" />
                    <span>{totalLessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={15} className="text-gray-400" />
                    <span>Full lifetime access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-3 gap-10">
        <div className="col-span-2 space-y-10">

          {/* Description */}
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-4">About this course</h2>
            <p className="text-gray-600 leading-relaxed">{course.description}</p>
          </div>

          {/* Curriculum */}
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Course Curriculum</h2>
            <div className="space-y-3">
              {course.sections?.map((section) => (
                <div key={section.id} className="card overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown size={18} className={`text-gray-400 transition-transform ${expanded === section.id ? 'rotate-180' : ''}`} />
                      <span className="font-semibold text-gray-900">{section.title}</span>
                    </div>
                    <span className="text-sm text-gray-500">{section.lessons?.length || 0} lessons</span>
                  </button>

                  {expanded === section.id && (
                    <div className="border-t border-gray-100">
                      {section.lessons?.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <div className="text-gray-400">
                            {lesson.is_preview
                              ? <Play size={15} className="text-indigo-500" />
                              : <Lock size={15} />
                            }
                          </div>
                          <span className="flex-1 text-sm text-gray-700">{lesson.title}</span>
                          {lesson.is_preview && (
                            <span className="badge bg-indigo-50 text-indigo-600 text-xs">Preview</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {Math.floor((lesson.duration_seconds || 0) / 60)}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-4">
              Student Reviews
              <span className="text-base font-normal text-gray-500 ml-2">
                ({reviewsData?.reviews?.length || 0})
              </span>
            </h2>
            {!reviewsData?.reviews?.length ? (
              <div className="card p-10 text-center text-gray-400">
                <Star size={32} className="mx-auto mb-2 opacity-20" />
                No reviews yet. Be the first!
              </div>
            ) : (
              <div className="space-y-4">
                {reviewsData.reviews.map(r => (
                  <div key={r.id} className="card p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                        {r.user_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{r.user_name}</p>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12}
                              className={i < r.rating ? 'text-yellow-400' : 'text-gray-200'}
                              fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructor sidebar */}
        <div className="col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="font-display font-bold text-gray-900 mb-4">Your Instructor</h3>
            <div className="flex items-center gap-3 mb-4">
              {course.instructor_avatar
                ? <img src={course.instructor_avatar} className="w-14 h-14 rounded-full object-cover" alt="" />
                : <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {course.instructor_name?.charAt(0)}
                  </div>
              }
              <div>
                <p className="font-semibold text-gray-900">{course.instructor_name}</p>
                <p className="text-xs text-gray-500">Instructor</p>
              </div>
            </div>
            {course.instructor_bio && (
              <p className="text-sm text-gray-600 leading-relaxed">{course.instructor_bio}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
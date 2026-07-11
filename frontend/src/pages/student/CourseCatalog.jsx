import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { Search, BookOpen } from 'lucide-react'

export default function CourseCatalog() {
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search, level],
    queryFn: () => api.get('/courses', { params: { search, level, limit: 20 } }).then(r => r.data),
  })

 const handleEnroll = async (course) => {
  try {
    if (!course.is_free && course.price > 0) {
      // Initiate Khalti payment
      const phone = prompt('Enter your phone number for payment (e.g. 9800000000):')
      if (!phone) return

      const { data } = await api.post('/payments/initiate', {
        course_id: course.id,
        phone,
      })
      window.location.href = data.payment_url
      return
    }

    await api.post('/enrollments', { course_id: course.id })
    toast.success('Enrolled successfully!')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to enroll')
  }
}

  return (
    <div className="p-8">
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Course Catalog</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-11" placeholder="Search courses..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.courses?.length ? (
        <div className="card p-16 text-center">
          <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No courses found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {data.courses.map((course) => (
            <div key={course.id} className="card overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">
              <img src={course.thumbnail_url || 'https://placehold.co/400x220?text=Course'}
                alt={course.title} className="w-full h-44 object-cover" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge bg-indigo-50 text-indigo-600 text-xs">{course.level}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {course.is_free ? 'Free' : `$${course.price}`}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-1">by {course.instructor_name}</p>
                <p className="text-xs text-gray-400 mb-4 line-clamp-2">{course.short_description}</p>
                <button onClick={() => handleEnroll(course.id)} className="btn-primary w-full text-sm">
                  Enroll Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
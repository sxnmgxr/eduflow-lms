import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { Plus, BookOpen, Edit3, Eye, EyeOff } from 'lucide-react'

export default function InstructorCourses() {
  const { data, isLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => api.get('/courses/my/list').then(r => r.data.courses),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 mt-1">Manage your teaching content</p>
        </div>
        <Link to="/instructor/courses/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Course
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.length ? (
        <div className="card p-16 text-center">
          <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
          <Link to="/instructor/courses/new" className="btn-primary inline-block">Create your first course</Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {data.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              <img src={c.thumbnail_url || 'https://placehold.co/400x220?text=Course'}
                alt={c.title} className="w-full h-40 object-cover" />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge text-xs ${c.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.is_published ? <Eye size={11} /> : <EyeOff size={11} />}
                    {c.is_published ? 'Published' : 'Draft'}
                  </span>
                  <span className="badge bg-indigo-50 text-indigo-600 text-xs capitalize">{c.level}</span>
                </div>
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{c.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{c.enrolled_count} students</p>
                <Link to={`/instructor/courses/${c.id}/edit`}
                  className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
                  <Edit3 size={14} /> Manage Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
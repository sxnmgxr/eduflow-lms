import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { BookOpen } from 'lucide-react'

export default function AdminCourses() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => api.get('/courses', { params: { limit: 50 } }).then(r => r.data),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Courses</h1>
        <button className="btn-primary text-sm">+ New Course</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Course', 'Instructor', 'Level', 'Students', 'Status'].map(h => (
                <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : !data?.courses?.length ? (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <BookOpen size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">No courses yet</p>
                </td>
              </tr>
            ) : data.courses.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={c.thumbnail_url || 'https://placehold.co/48x48?text=C'}
                      alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="font-medium text-gray-900 line-clamp-1">{c.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">{c.instructor_name}</td>
                <td className="px-6 py-4">
                  <span className="badge bg-indigo-50 text-indigo-600 text-xs">{c.level}</span>
                </td>
                <td className="px-6 py-4 text-gray-900 font-medium">{c.enrolled_count}</td>
                <td className="px-6 py-4">
                  <span className={`badge text-xs ${c.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
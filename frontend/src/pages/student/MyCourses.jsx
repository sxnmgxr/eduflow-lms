import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { BookOpen } from 'lucide-react'

export default function MyCourses() {
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => api.get('/enrollments/my').then(r => r.data.enrollments),
  })

  if (isLoading) return (
    <div className="p-8 flex justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8">
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">My Courses</h1>
      {!enrollments?.length ? (
        <div className="card p-16 text-center">
          <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
          <a href="/dashboard/catalog" className="btn-primary inline-block">Browse Catalog</a>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {enrollments.map((e) => (
            <div key={e.id} className="card overflow-hidden hover:shadow-md transition-shadow">
              <img src={e.thumbnail_url || 'https://placehold.co/400x220?text=Course'}
                alt={e.title} className="w-full h-44 object-cover" />
              <div className="p-5">
                <span className={`badge text-xs mb-2 ${e.level === 'beginner' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {e.level}
                </span>
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{e.title}</h3>
                <p className="text-sm text-gray-500 mb-3">by {e.instructor_name}</p>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Progress</span><span>{e.progress_percent}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${e.progress_percent}%` }} />
                </div>
                {e.progress_percent === 100 && (
                  <div className="mt-3 text-center text-sm font-medium text-green-600">
                    ✅ Completed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
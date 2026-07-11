import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import api from '../../api/client'
import { BookOpen, Clock, Trophy, TrendingUp } from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuthStore()

  const { data: enrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => api.get('/enrollments/my').then(r => r.data.enrollments),
  })

  const stats = [
    { label: 'Enrolled Courses', value: enrollments?.length || 0, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
    { label: 'Hours Learned', value: '0', icon: Clock, color: 'bg-green-50 text-green-600' },
    { label: 'Completed', value: enrollments?.filter(e => e.progress_percent === 100).length || 0, icon: Trophy, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Avg Progress', value: `${Math.round((enrollments?.reduce((a, e) => a + e.progress_percent, 0) || 0) / (enrollments?.length || 1))}%`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's your learning progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <div className="text-2xl font-display font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent courses */}
      <div>
        <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">Continue Learning</h2>
        {!enrollments?.length ? (
          <div className="card p-12 text-center">
            <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No courses yet.</p>
            <a href="/dashboard/catalog" className="btn-primary inline-block mt-4 text-sm">
              Browse Courses
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {enrollments.slice(0, 3).map((e) => (
              <div key={e.id} className="card p-5">
                <img src={e.thumbnail_url || 'https://placehold.co/400x220?text=Course'}
                  alt={e.title} className="w-full h-36 object-cover rounded-xl mb-4" />
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{e.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{e.instructor_name}</span>
                  <span>{e.progress_percent}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-indigo-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${e.progress_percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
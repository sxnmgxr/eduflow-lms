import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { Users, BookOpen, TrendingUp, DollarSign } from 'lucide-react'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  })

  const cards = [
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Courses', value: stats?.totalCourses ?? 0, icon: BookOpen, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Enrollments', value: stats?.totalEnrollments ?? 0, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: 'Revenue', value: `$${Number(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: DollarSign, color: 'bg-yellow-50 text-yellow-600' },
  ]

  if (isLoading) return (
    <div className="p-8 flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Platform overview</p>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-6">
            <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}>
              <Icon size={22} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Welcome to EduFlow Admin</h2>
        <p className="text-sm text-gray-500">
          Use the sidebar to manage courses, users, and categories.
        </p>
      </div>
    </div>
  )
}
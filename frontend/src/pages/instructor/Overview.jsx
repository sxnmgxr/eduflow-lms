import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { BookOpen, Users, Eye } from 'lucide-react'

export default function InstructorOverview() {
  const { user } = useAuthStore()
  const { data } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => api.get('/courses/my/list').then(r => r.data.courses),
  })

  const totalStudents = data?.reduce((a, c) => a + c.enrolled_count, 0) || 0
  const published = data?.filter(c => c.is_published).length || 0

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="text-gray-500 mt-1 mb-8">Here's how your courses are doing</p>

      <div className="grid grid-cols-3 gap-5">
        <div className="card p-6">
          <div className="inline-flex p-3 rounded-xl bg-indigo-50 text-indigo-600 mb-3"><BookOpen size={20} /></div>
          <div className="text-3xl font-bold text-gray-900">{data?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Courses</div>
        </div>
        <div className="card p-6">
          <div className="inline-flex p-3 rounded-xl bg-green-50 text-green-600 mb-3"><Eye size={20} /></div>
          <div className="text-3xl font-bold text-gray-900">{published}</div>
          <div className="text-sm text-gray-500 mt-1">Published</div>
        </div>
        <div className="card p-6">
          <div className="inline-flex p-3 rounded-xl bg-blue-50 text-blue-600 mb-3"><Users size={20} /></div>
          <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
          <div className="text-sm text-gray-500 mt-1">Total Students</div>
        </div>
      </div>
    </div>
  )
}
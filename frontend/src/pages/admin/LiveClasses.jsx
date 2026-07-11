import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { Plus, Video, ExternalLink, Trash2 } from 'lucide-react'

export default function AdminLiveClasses() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState({
    course_id: '', title: '', description: '',
    platform: 'zoom', meeting_url: '', meeting_id: '',
    passcode: '', scheduled_at: '', duration_minutes: 60,
  })

  useQuery({
    queryKey: ['courses-list'],
    queryFn: () => api.get('/courses?limit=100').then(r => { setCourses(r.data.courses); return r.data }),
  })

  // Get all upcoming classes (admin sees all)
  const { data } = useQuery({
    queryKey: ['all-live-classes'],
    queryFn: async () => {
      const { data: coursesData } = await api.get('/courses?limit=100')
      const classes = await Promise.all(
        (coursesData.courses || []).map(c =>
          api.get(`/live-classes/course/${c.id}`)
            .then(r => r.data.liveClasses.map(lc => ({ ...lc, course_title: c.title })))
            .catch(() => [])
        )
      )
      return classes.flat().sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    },
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/live-classes', form),
    onSuccess: () => {
      toast.success('Live class scheduled!')
      qc.invalidateQueries(['all-live-classes'])
      setShowForm(false)
      setForm({ course_id: '', title: '', description: '', platform: 'zoom', meeting_url: '', meeting_id: '', passcode: '', scheduled_at: '', duration_minutes: 60 })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/live-classes/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['all-live-classes']) },
  })

  const platformColors = { zoom: 'bg-blue-50 text-blue-700', google_meet: 'bg-green-50 text-green-700', other: 'bg-gray-100 text-gray-600' }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Classes</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Schedule Class
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-5">Schedule New Live Class</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Course</label>
              <select className="input" value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
                <option value="">Select course</option>
                {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input className="input" placeholder="e.g. Week 1 - Live Q&A Session"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform</label>
              <select className="input" value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                <option value="zoom">Zoom</option>
                <option value="google_meet">Google Meet</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
              <input type="number" className="input" value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meeting URL</label>
              <input className="input" placeholder="https://zoom.us/j/..."
                value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meeting ID</label>
              <input className="input" placeholder="123 456 7890"
                value={form.meeting_id} onChange={(e) => setForm({ ...form, meeting_id: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passcode</label>
              <input className="input" placeholder="abc123"
                value={form.passcode} onChange={(e) => setForm({ ...form, passcode: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Scheduled Date & Time</label>
              <input type="datetime-local" className="input"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => createMutation.mutate()}
              disabled={!form.course_id || !form.title || !form.meeting_url || !form.scheduled_at || createMutation.isPending}
              className="btn-primary">
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Class'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {!data?.length ? (
          <div className="card p-16 text-center text-gray-400">
            <Video size={40} className="mx-auto mb-3 opacity-20" />
            No live classes scheduled yet
          </div>
        ) : data?.map((lc) => (
          <div key={lc.id} className="card p-5 flex items-center gap-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${lc.platform === 'zoom' ? 'bg-blue-100' : 'bg-green-100'}`}>
              <Video size={22} className={lc.platform === 'zoom' ? 'text-blue-600' : 'text-green-600'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-gray-900">{lc.title}</h3>
                <span className={`badge text-xs ${platformColors[lc.platform]}`}>
                  {lc.platform === 'google_meet' ? 'Google Meet' : lc.platform}
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-1">{lc.course_title}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(lc.scheduled_at).toLocaleString()} · {lc.duration_minutes} min
              </p>
              {lc.meeting_id && (
                <p className="text-xs text-gray-400">ID: {lc.meeting_id} {lc.passcode && `· Pass: ${lc.passcode}`}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a href={lc.meeting_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <ExternalLink size={15} /> Join
              </a>
              <button onClick={() => deleteMutation.mutate(lc.id)}
                className="text-gray-300 hover:text-red-500 transition-colors p-1">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
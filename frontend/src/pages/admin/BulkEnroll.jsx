import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { Users, Upload, CheckCircle, XCircle } from 'lucide-react'

export default function BulkEnroll() {
  const [courseId, setCourseId] = useState('')
  const [emailsText, setEmailsText] = useState('')
  const [results, setResults] = useState(null)

  const { data: courses } = useQuery({
    queryKey: ['all-courses-admin'],
    queryFn: () => api.get('/courses?limit=100').then(r => r.data.courses),
  })

  const bulkMutation = useMutation({
    mutationFn: () => {
      const emails = emailsText.split('\n').map(e => e.trim()).filter(Boolean)
      return api.post('/qr-payments/bulk-enroll', { course_id: courseId, emails })
    },
    onSuccess: ({ data }) => {
      setResults(data)
      toast.success(`Enrolled ${data.success} students!`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <Users size={24} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Enrollment</h1>
          <p className="text-gray-500">Enroll multiple students at once</p>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Course</label>
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">-- Choose a course --</option>
            {courses?.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Student Emails
            <span className="text-gray-400 font-normal ml-2">(one per line)</span>
          </label>
          <textarea
            className="input resize-none font-mono text-sm"
            rows={10}
            placeholder={`student1@example.com\nstudent2@example.com\nstudent3@example.com`}
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            {emailsText.split('\n').filter(e => e.trim()).length} emails entered
          </p>
        </div>

        <button
          onClick={() => bulkMutation.mutate()}
          disabled={!courseId || !emailsText.trim() || bulkMutation.isPending}
          className="btn-primary flex items-center gap-2">
          <Upload size={16} />
          {bulkMutation.isPending ? 'Enrolling...' : 'Enroll Students'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="card p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Enrollment Results</h3>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={18} />
              <span className="font-semibold">{results.success} succeeded</span>
            </div>
            <div className="flex items-center gap-2 text-red-500">
              <XCircle size={18} />
              <span className="font-semibold">{results.failed} failed</span>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {results.results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg
                ${r.status === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className={r.status === 'success' ? 'text-green-700' : 'text-red-600'}>
                  {r.email}
                </span>
                <span className="text-xs text-gray-500">{r.reason || 'Enrolled'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
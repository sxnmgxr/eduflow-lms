import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { Award, Download, Loader2, BookOpen } from 'lucide-react'

export default function Certificates() {
  const [generating, setGenerating] = useState(null)

  const { data: certs, isLoading, refetch } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => api.get('/certificates/my').then(r => r.data.certificates),
  })

  const { data: enrollments } = useQuery({
    queryKey: ['completed-enrollments'],
    queryFn: () => api.get('/enrollments/my').then(r =>
      r.data.enrollments.filter(e => e.progress_percent === 100)
    ),
  })

  const generateMutation = useMutation({
    mutationFn: (courseId) => api.post('/certificates/generate', { course_id: courseId }),
    onSuccess: ({ data }) => {
      toast.success('Certificate generated! 🎓')
      window.open(data.certificate_url, '_blank')
      refetch()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate'),
  })

  const handleGenerate = async (courseId) => {
    setGenerating(courseId)
    try {
      await generateMutation.mutateAsync(courseId)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <Award size={24} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-500">Download your earned certificates</p>
        </div>
      </div>

      {/* Issued certificates */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : certs?.length > 0 ? (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Issued Certificates</h2>
          <div className="grid grid-cols-3 gap-5">
            {certs.map((cert) => (
              <div key={cert.id} className="card overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 h-32 flex items-center justify-center relative">
                  <Award size={48} className="text-white/30" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <p className="text-xs font-medium opacity-75">CERTIFICATE</p>
                    <p className="text-sm font-bold mt-1">OF COMPLETION</p>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                    {cert.course_title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Issued {new Date(cert.issued_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                  <a href={cert.certificate_url} target="_blank" rel="noreferrer"
                    className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                    <Download size={15} /> Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Completed courses without certificates */}
      {enrollments?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ready to Generate
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({enrollments.length} completed courses)
            </span>
          </h2>
          <div className="grid grid-cols-3 gap-5">
            {enrollments.map((e) => {
              const hasCert = certs?.some(c => c.course_id === e.course_id)
              if (hasCert) return null
              return (
                <div key={e.id} className="card p-5">
                  <img
                    src={e.thumbnail_url || 'https://placehold.co/400x200?text=Course'}
                    alt={e.title}
                    className="w-full h-32 object-cover rounded-xl mb-4"
                  />
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{e.title}</h3>
                  <p className="text-xs text-gray-500 mb-4">by {e.instructor_name}</p>
                  <button
                    onClick={() => handleGenerate(e.course_id)}
                    disabled={generating === e.course_id}
                    className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                    {generating === e.course_id
                      ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
                      : <><Award size={14} /> Get Certificate</>
                    }
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!certs?.length && !enrollments?.length && (
        <div className="card p-16 text-center">
          <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No certificates yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Complete a course to earn your first certificate
          </p>
          <a href="/dashboard/catalog" className="btn-primary inline-block text-sm">
            Browse Courses
          </a>
        </div>
      )}
    </div>
  )
}
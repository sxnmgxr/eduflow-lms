import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../api/client'
import Navbar from '../components/ui/Navbar'
import toast from 'react-hot-toast'
import { Star, Send } from 'lucide-react'

export default function Testimonials() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', role: '', content: '', rating: 5 })
  const [submitted, setSubmitted] = useState(false)

  const { data } = useQuery({
    queryKey: ['public-testimonials'],
    queryFn: () => api.get('/cms/testimonials').then(r => r.data),
  })

  const submitMutation = useMutation({
    mutationFn: () => api.post('/cms/testimonials', form),
    onSuccess: () => {
      toast.success('Thank you! Your testimonial is under review.')
      setSubmitted(true)
      setShowForm(false)
    },
    onError: () => toast.error('Submission failed. Please try again.'),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">What Our Students Say</h1>
          <p className="text-gray-500 text-lg mb-6">Real stories from real learners</p>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            Share Your Experience
          </button>
        </div>

        {/* Submit form */}
        {showForm && !submitted && (
          <div className="card p-8 mb-10 max-w-lg mx-auto">
            <h3 className="font-bold text-gray-900 text-lg mb-5">Share Your Story</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                  <input className="input" placeholder="Full name"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role / Title</label>
                  <input className="input" placeholder="e.g. DevOps Engineer"
                    value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setForm({ ...form, rating: n })}>
                      <Star size={28}
                        className={n <= form.rating ? 'text-yellow-400' : 'text-gray-200'}
                        fill={n <= form.rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Experience</label>
                <textarea className="input resize-none" rows={4}
                  placeholder="Tell us how EduFlow helped you..."
                  value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={!form.name || !form.content || submitMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2">
                <Send size={16} />
                {submitMutation.isPending ? 'Submitting...' : 'Submit Testimonial'}
              </button>
            </div>
          </div>
        )}

        {/* Testimonials grid */}
        <div className="grid grid-cols-3 gap-6">
          {data?.testimonials?.map(t => (
            <div key={t.id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16}
                    className={i < t.rating ? 'text-yellow-400' : 'text-gray-200'}
                    fill="currentColor" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-5 italic">"{t.content}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                  {t.avatar_url
                    ? <img src={t.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                    : t.name?.charAt(0)
                  }
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  {t.role && <p className="text-xs text-gray-500">{t.role}</p>}
                </div>
              </div>
            </div>
          ))}
          {!data?.testimonials?.length && (
            <div className="col-span-3 text-center py-12 text-gray-400">No testimonials yet. Be the first!</div>
          )}
        </div>
      </div>
    </div>
  )
}
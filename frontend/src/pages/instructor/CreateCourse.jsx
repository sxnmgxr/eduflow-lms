import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { ImagePlus, ArrowLeft } from 'lucide-react'

export default function CreateCourse() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', short_description: '',
    category_id: '', price: 0, is_free: true,
    level: 'beginner', language: 'English',
  })
  const [thumbnail, setThumbnail] = useState(null)
  const [preview, setPreview] = useState(null)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/admin/categories').then(r => r.data.categories).catch(() => []),
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (thumbnail) fd.append('thumbnail', thumbnail)
      return api.post('/courses', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: ({ data }) => {
      toast.success('Course created! Now add your content.')
      navigate(`/instructor/courses/${data.course.id}/edit`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create course'),
  })

  const handleThumbnail = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnail(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New Course</h1>
      <p className="text-gray-500 mb-8">Start with the basics, you can add lessons after</p>

      <div className="card p-8 space-y-5">
        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Thumbnail</label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden">
            {preview ? (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <ImagePlus size={28} className="mb-2" />
                <span className="text-sm">Click to upload thumbnail</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title</label>
          <input className="input" placeholder="e.g. Complete DevOps Bootcamp"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
          <input className="input" placeholder="One-line summary for course cards"
            value={form.short_description}
            onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description</label>
          <textarea className="input resize-none" rows={5}
            placeholder="What will students learn in this course?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Level</label>
            <select className="input" value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
            <input className="input" value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={form.is_free}
              onChange={(e) => setForm({ ...form, is_free: e.target.checked })}
              className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm font-medium text-gray-700">This course is free</span>
          </label>
          {!form.is_free && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD)</label>
              <input type="number" className="input" min="0" step="0.01"
                value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
          )}
        </div>

        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !form.title}
          className="btn-primary w-full">
          {createMutation.isPending ? 'Creating...' : 'Create Course & Continue'}
        </button>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { Plus, Tag } from 'lucide-react'

const ICONS = ['💻', '☁️', '🔐', '📊', '📱', '🤖', '🎨', '📈', '🗄️', '⚙️']

export default function AdminCategories() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', description: '', icon: '💻' })
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/admin/categories').then(r => r.data.categories),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/admin/categories', form),
    onSuccess: () => {
      toast.success('Category created!')
      qc.invalidateQueries(['admin-categories'])
      setForm({ name: '', description: '', icon: '💻' })
      setShowForm(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Organize courses by topic</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Category
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Create Category</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input className="input" placeholder="e.g. DevOps & Cloud"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map(icon => (
                  <button key={icon} onClick={() => setForm({ ...form, icon })}
                    className={`text-xl p-2 rounded-lg border-2 transition-all
                      ${form.icon === icon ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <input className="input" placeholder="Short description"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => createMutation.mutate()}
              disabled={!form.name || createMutation.isPending}
              className="btn-primary text-sm">
              {createMutation.isPending ? 'Creating...' : 'Create Category'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.length ? (
        <div className="card p-16 text-center">
          <Tag size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No categories yet</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            Create first category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {data.map((cat) => (
            <div key={cat.id} className="card p-5">
              <div className="text-3xl mb-3">{cat.icon || '📚'}</div>
              <h3 className="font-semibold text-gray-900">{cat.name}</h3>
              {cat.description && (
                <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { Plus, CreditCard } from 'lucide-react'

export default function InstallmentPlans() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    course_id: '', total_amount: '',
    installments: 3, interval_days: 30,
  })

  const { data: courses } = useQuery({
    queryKey: ['courses-all'],
    queryFn: () => api.get('/courses?limit=100').then(r => r.data.courses),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/installments/plans', form),
    onSuccess: () => {
      toast.success('Installment plan created!')
      qc.invalidateQueries(['installment-plans'])
      setShowForm(false)
      setForm({ course_id: '', total_amount: '', installments: 3, interval_days: 30 })
    },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Installment Plans</h1>
          <p className="text-gray-500 mt-1">Let students pay in installments</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Plan
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Create Installment Plan</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Course</label>
              <select className="input" value={form.course_id}
                onChange={(e) => {
                  const course = courses?.find(c => c.id === e.target.value)
                  setForm({ ...form, course_id: e.target.value, total_amount: course?.price || '' })
                }}>
                <option value="">Select course</option>
                {courses?.filter(c => !c.is_free && c.price > 0).map(c => (
                  <option key={c.id} value={c.id}>{c.title} — NPR {c.price}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Amount (NPR)</label>
              <input type="number" className="input" value={form.total_amount}
                onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Installments</label>
              <select className="input" value={form.installments}
                onChange={(e) => setForm({ ...form, installments: parseInt(e.target.value) })}>
                <option value={2}>2 Installments</option>
                <option value={3}>3 Installments</option>
                <option value={4}>4 Installments</option>
                <option value={6}>6 Installments</option>
                <option value={12}>12 Installments</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Interval (days)</label>
              <select className="input" value={form.interval_days}
                onChange={(e) => setForm({ ...form, interval_days: parseInt(e.target.value) })}>
                <option value={7}>Weekly (7 days)</option>
                <option value={14}>Bi-weekly (14 days)</option>
                <option value={30}>Monthly (30 days)</option>
                <option value={60}>Every 2 months</option>
              </select>
            </div>
            <div className="col-span-2">
              {form.total_amount && form.installments && (
                <div className="bg-indigo-50 rounded-xl p-4 text-sm">
                  <p className="font-medium text-indigo-900">Plan Preview</p>
                  <p className="text-indigo-700 mt-1">
                    {form.installments} payments of{' '}
                    <strong>NPR {(form.total_amount / form.installments).toFixed(0)}</strong>{' '}
                    every {form.interval_days} days
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => createMutation.mutate()}
              disabled={!form.course_id || !form.total_amount || createMutation.isPending}
              className="btn-primary text-sm">
              {createMutation.isPending ? 'Creating...' : 'Create Plan'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="card p-16 text-center">
        <CreditCard size={40} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 mb-2">Installment plans are linked to courses</p>
        <p className="text-sm text-gray-400">Create a plan above and students can choose to pay in installments when enrolling</p>
      </div>
    </div>
  )
}
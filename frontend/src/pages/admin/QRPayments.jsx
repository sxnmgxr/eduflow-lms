import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Eye } from 'lucide-react'

export default function QRPayments() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('pending')
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['qr-payments', filter],
    queryFn: () => api.get(`/qr-payments/admin?status=${filter}`).then(r => r.data.payments),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => api.patch(`/qr-payments/${id}/approve`, { note }),
    onSuccess: () => {
      toast.success('Payment approved, student enrolled!')
      qc.invalidateQueries(['qr-payments'])
      setSelected(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => api.patch(`/qr-payments/${id}/reject`, { note }),
    onSuccess: () => {
      toast.success('Payment rejected')
      qc.invalidateQueries(['qr-payments'])
      setSelected(null)
    },
  })

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">QR Payment Ledger</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all
              ${filter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Student', 'Course', 'Amount', 'Reference', 'Date', 'Status', 'Action'].map(h => (
                <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : !data?.length ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No {filter} payments</td></tr>
            ) : data.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-gray-900">{p.user_name}</p>
                  <p className="text-xs text-gray-500">{p.user_email}</p>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700 max-w-xs">
                  <p className="line-clamp-1">{p.course_title}</p>
                  <p className="text-xs text-gray-400">NPR {p.course_price}</p>
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                  NPR {Number(p.amount).toFixed(2)}
                </td>
                <td className="px-5 py-4 text-sm text-gray-500 font-mono">
                  {p.reference_number || '—'}
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <span className={`badge text-xs capitalize ${statusColor[p.status]}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {p.screenshot_url && (
                      <a href={p.screenshot_url} target="_blank" rel="noreferrer"
                        className="text-indigo-500 hover:text-indigo-700">
                        <Eye size={16} />
                      </a>
                    )}
                    {p.status === 'pending' && (
                      <>
                        <button onClick={() => setSelected(p)}
                          className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium">
                          Review
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 mb-4">Review Payment</h3>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Student</span>
                <span className="font-medium">{selected.user_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Course</span>
                <span className="font-medium line-clamp-1 max-w-xs text-right">{selected.course_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-gray-900">NPR {selected.amount}</span>
              </div>
              {selected.reference_number && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-mono">{selected.reference_number}</span>
                </div>
              )}
            </div>

            {selected.screenshot_url && (
              <img src={selected.screenshot_url} alt="Payment screenshot"
                className="w-full h-48 object-cover rounded-xl mb-4 border border-gray-100" />
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (optional)</label>
              <input className="input" placeholder="Add a note..."
                value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => approveMutation.mutate(selected.id)}
                disabled={approveMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl transition-colors">
                <CheckCircle size={16} />
                {approveMutation.isPending ? 'Approving...' : 'Approve & Enroll'}
              </button>
              <button
                onClick={() => rejectMutation.mutate(selected.id)}
                disabled={rejectMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-xl transition-colors">
                <XCircle size={16} />
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>

            <button onClick={() => { setSelected(null); setNote('') }}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
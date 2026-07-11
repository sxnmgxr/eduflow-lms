import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { CreditCard } from 'lucide-react'

const statusColor = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
}

export default function PaymentHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => api.get('/payments/history').then(r => r.data.payments),
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h1>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.length ? (
        <div className="card p-16 text-center">
          <CreditCard size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No payment history yet</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Course', 'Amount', 'Method', 'Status', 'Date', 'Transaction'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.thumbnail_url || 'https://placehold.co/40x40?text=C'}
                        className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <span className="text-sm font-medium text-gray-900 line-clamp-1 max-w-xs">
                        {p.course_title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    NPR {Number(p.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                    {p.payment_method}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge text-xs capitalize ${statusColor[p.status] || 'bg-gray-100 text-gray-500'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                    {p.transaction_id ? p.transaction_id.substring(0, 12) + '...' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
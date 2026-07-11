import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2 } from 'lucide-react'

export default function Finance() {
  const qc = useQueryClient()
  const [year] = useState(new Date().getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'income', category: '', title: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' })
  const [activeTab, setActiveTab] = useState('overview')

  const { data: dashboard } = useQuery({
    queryKey: ['finance-dashboard', year],
    queryFn: () => api.get(`/finance/dashboard?year=${year}`).then(r => r.data),
  })

  const { data: txData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/finance/transactions?limit=50').then(r => r.data),
  })

  const { data: salaryData } = useQuery({
    queryKey: ['salaries'],
    queryFn: () => api.get('/finance/salaries').then(r => r.data),
  })

  const addTxMutation = useMutation({
    mutationFn: () => api.post('/finance/transactions', form),
    onSuccess: () => {
      toast.success('Transaction added')
      qc.invalidateQueries(['transactions'])
      qc.invalidateQueries(['finance-dashboard'])
      setShowForm(false)
      setForm({ type: 'income', category: '', title: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' })
    },
  })

  const payMutation = useMutation({
    mutationFn: (id) => api.patch(`/finance/salaries/${id}/pay`),
    onSuccess: () => { toast.success('Salary marked as paid'); qc.invalidateQueries(['salaries']) },
  })

  const cards = [
    { label: 'Total Revenue', value: `NPR ${Number(dashboard?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Total Expenses', value: `NPR ${Number(dashboard?.totalExpense || 0).toLocaleString()}`, icon: TrendingDown, color: 'bg-red-50 text-red-600' },
    { label: 'Salaries Paid', value: `NPR ${Number(dashboard?.salariesPaid || 0).toLocaleString()}`, icon: TrendingDown, color: 'bg-orange-50 text-orange-600' },
    { label: 'Net Profit', value: `NPR ${Number(dashboard?.netProfit || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Finance & Accounting</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}><Icon size={20} /></div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {['overview', 'transactions', 'salaries'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all
              ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'transactions' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Income & Expenses</h2>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Add Transaction
            </button>
          </div>

          {showForm && (
            <div className="card p-5 mb-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <input className="input" placeholder="e.g. Course Sales"
                    value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (NPR)</label>
                  <input type="number" className="input" placeholder="0.00"
                    value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input className="input" placeholder="Description"
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input type="date" className="input" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => addTxMutation.mutate()} disabled={!form.title || !form.amount} className="btn-primary text-sm">Add</button>
                <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Date','Type','Category','Title','Amount'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {txData?.transactions?.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge text-xs ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{tx.category}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-800">{tx.title}</td>
                    <td className={`px-5 py-3.5 text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'} NPR {Number(tx.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'salaries' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructor Salaries</h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Instructor','Month/Year','Amount','Method','Status','Action'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {salaryData?.salaries?.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900">{s.instructor_name}</p>
                      <p className="text-xs text-gray-400">{s.instructor_email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{s.month}/{s.year}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">NPR {Number(s.amount).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{s.payment_method || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge text-xs ${s.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {s.status === 'pending' && (
                        <button onClick={() => payMutation.mutate(s.id)}
                          className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium">
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
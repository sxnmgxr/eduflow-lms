import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { Link2, Copy, DollarSign, Users, TrendingUp, Gift } from 'lucide-react'

export default function AffiliatePage() {
  const qc = useQueryClient()
  const [payoutForm, setPayoutForm] = useState({ method: 'khalti', reference: '' })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-affiliate'],
    queryFn: () => api.get('/affiliates/my').then(r => r.data),
    retry: false,
  })

  const registerMutation = useMutation({
    mutationFn: () => api.post('/affiliates/register'),
    onSuccess: () => { toast.success('Registered as affiliate!'); refetch() },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const payoutMutation = useMutation({
    mutationFn: () => api.post('/affiliates/payout', payoutForm),
    onSuccess: () => {
      toast.success('Payout requested!')
      qc.invalidateQueries(['my-affiliate'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const copyLink = () => {
    navigator.clipboard.writeText(data?.referralLink)
    toast.success('Referral link copied!')
  }

  if (isLoading) return (
    <div className="p-8 flex justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data?.affiliate) return (
    <div className="p-8">
      <div className="card p-16 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Gift size={28} className="text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Join Our Affiliate Program</h2>
        <p className="text-gray-500 mb-2">Earn <strong>10% commission</strong> for every course purchase through your referral link.</p>
        <p className="text-sm text-gray-400 mb-6">Minimum payout: NPR 500 via Khalti or eSewa</p>
        <button onClick={() => registerMutation.mutate()}
          disabled={registerMutation.isPending}
          className="btn-primary">
          {registerMutation.isPending ? 'Registering...' : 'Become an Affiliate'}
        </button>
      </div>
    </div>
  )

  const { affiliate, referrals, payouts, referralLink } = data

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Affiliate Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Earnings', value: `NPR ${Number(affiliate.total_earnings).toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
          { label: 'Pending', value: `NPR ${Number(affiliate.pending_earnings).toLocaleString()}`, icon: TrendingUp, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Paid Out', value: `NPR ${Number(affiliate.paid_earnings).toLocaleString()}`, icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Referrals', value: referrals?.length || 0, icon: Users, color: 'bg-indigo-50 text-indigo-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}><Icon size={18} /></div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Link2 size={18} className="text-indigo-600" /> Your Referral Link
        </h3>
        <div className="flex gap-3">
          <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-600 font-mono border border-gray-200 truncate">
            {referralLink}
          </div>
          <button onClick={copyLink} className="btn-primary flex items-center gap-2 text-sm">
            <Copy size={15} /> Copy
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Commission rate: <strong>{affiliate.commission_rate}%</strong> per successful purchase
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Referral history */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Referral History</h3>
          {!referrals?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">No referrals yet. Share your link!</p>
          ) : (
            <div className="space-y-3">
              {referrals.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.referred_name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">{r.course_title || 'General signup'}</p>
                    <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">+NPR {Number(r.commission_amount).toFixed(0)}</p>
                    <span className={`badge text-xs ${r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout request */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Request Payout</h3>
          {affiliate.pending_earnings >= 500 ? (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">NPR {Number(affiliate.pending_earnings).toLocaleString()}</p>
                <p className="text-sm text-green-700 mt-1">Available for payout</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                <select className="input" value={payoutForm.method}
                  onChange={(e) => setPayoutForm({ ...payoutForm, method: e.target.value })}>
                  <option value="khalti">Khalti</option>
                  <option value="esewa">eSewa</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number / ID</label>
                <input className="input" placeholder="Your payment account number"
                  value={payoutForm.reference}
                  onChange={(e) => setPayoutForm({ ...payoutForm, reference: e.target.value })} />
              </div>
              <button onClick={() => payoutMutation.mutate()}
                disabled={!payoutForm.reference || payoutMutation.isPending}
                className="btn-primary w-full">
                {payoutMutation.isPending ? 'Requesting...' : 'Request Payout'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-1">Minimum payout: NPR 500</p>
              <p className="text-gray-400 text-sm">You need NPR {(500 - affiliate.pending_earnings).toFixed(0)} more</p>
            </div>
          )}

          {payouts?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Payout History</h4>
              {payouts.map(p => (
                <div key={p.id} className="flex justify-between text-sm py-1.5">
                  <span className="text-gray-600">NPR {Number(p.amount).toLocaleString()}</span>
                  <span className={`badge text-xs ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
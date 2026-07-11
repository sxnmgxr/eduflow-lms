import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function PaymentVerify() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verify = async () => {
      const pidx = params.get('pidx')
      const orderId = params.get('order_id')

      if (!pidx || !orderId) {
        setStatus('failed')
        setMessage('Invalid payment parameters')
        return
      }

      try {
        const { data } = await api.post('/payments/verify', { pidx, order_id: orderId })
        setStatus('success')
        setMessage(data.message)
        setTimeout(() => navigate('/dashboard/my-courses'), 3000)
      } catch (err) {
        setStatus('failed')
        setMessage(err.response?.data?.message || 'Payment verification failed')
      }
    }
    verify()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card p-12 text-center max-w-md w-full mx-4">
        {status === 'verifying' && (
          <>
            <Loader2 size={48} className="text-indigo-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-500">Please wait while we confirm your payment...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-4">{message}</p>
            <p className="text-sm text-gray-400">Redirecting to your courses...</p>
          </>
        )}
        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <button onClick={() => navigate(-2)} className="btn-primary w-full">
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
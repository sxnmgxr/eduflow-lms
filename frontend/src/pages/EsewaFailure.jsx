import { useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'

export default function EsewaFailure() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card p-12 text-center max-w-md w-full mx-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Cancelled</h2>
        <p className="text-gray-500 mb-6">
          Your eSewa payment was cancelled or failed. No amount has been deducted.
        </p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/dashboard/catalog')} className="btn-secondary flex-1">
            Browse Courses
          </button>
          <button onClick={() => navigate(-2)} className="btn-primary flex-1">
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
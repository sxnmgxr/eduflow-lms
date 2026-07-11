import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function EsewaPayment() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const formRef = useRef(null)
  const [formData, setFormData] = useState(null)
  const [loading, setLoading] = useState(true)

  const { data: course } = useQuery({
    queryKey: ['course-pay', courseId],
    queryFn: () => api.get(`/courses?search=`).then(r =>
      r.data.courses.find(c => c.id === courseId)
    ),
  })

  useEffect(() => {
    const initiate = async () => {
      try {
        const { data } = await api.post('/esewa/initiate', { course_id: courseId })
        setFormData(data)
        setLoading(false)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to initiate payment')
        navigate(-1)
      }
    }
    initiate()
  }, [courseId])

  useEffect(() => {
    if (formData && formRef.current) {
      // Auto-submit the form to eSewa
      setTimeout(() => formRef.current.submit(), 500)
    }
  }, [formData])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card p-12 text-center max-w-md w-full mx-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 size={32} className="text-green-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Redirecting to eSewa</h2>
        <p className="text-gray-500 mb-2">Please wait while we redirect you to eSewa payment gateway...</p>
        {course && (
          <div className="bg-gray-50 rounded-xl p-4 mt-4 text-left">
            <p className="text-sm text-gray-600">{course.title}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">NPR {course.price}</p>
          </div>
        )}

        {/* Hidden form that auto-submits to eSewa */}
        {formData && (
          <form
            ref={formRef}
            action={formData.payment_url}
            method="POST"
            className="hidden">
            {Object.entries(formData)
              .filter(([key]) => key !== 'payment_url')
              .map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}
          </form>
        )}
      </div>
    </div>
  )
}
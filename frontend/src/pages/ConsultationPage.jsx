import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../api/client'
import Navbar from '../components/ui/Navbar'
import toast from 'react-hot-toast'
import { MessageSquare, CheckCircle, Phone, Mail, MapPin } from 'lucide-react'

export default function ConsultationPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    subject: '', message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const submitMutation = useMutation({
    mutationFn: () => api.post('/cms/consultations', form),
    onSuccess: () => { toast.success('Request submitted!'); setSubmitted(true) },
    onError: () => toast.error('Submission failed. Please try again.'),
  })

  const contactInfo = [
    { icon: Phone, label: 'Phone', value: '+977 9800000000' },
    { icon: Mail, label: 'Email', value: 'hello@eduflow.com.np' },
    { icon: MapPin, label: 'Location', value: 'Kathmandu, Nepal' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Get a Free Consultation</h1>
          <p className="text-gray-500 text-lg">Talk to our team about your learning goals</p>
        </div>

        <div className="grid grid-cols-3 gap-12">
          {/* Contact info */}
          <div className="col-span-1 space-y-6">
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-5">Contact Information</h3>
              <div className="space-y-4">
                {contactInfo.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-800">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 bg-indigo-600 text-white">
              <h3 className="font-bold mb-3">Why choose EduFlow?</h3>
              {[
                'Expert-led video courses',
                'Live interactive sessions',
                'Industry-recognized certificates',
                'Lifetime course access',
                'Dedicated student support',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-indigo-100 mt-2">
                  <CheckCircle size={14} className="text-indigo-300 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="col-span-2">
            {submitted ? (
              <div className="card p-16 text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
                <p className="text-gray-500">Our team will contact you within 24 hours.</p>
              </div>
            ) : (
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <MessageSquare size={18} className="text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Send us a message</h3>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <input className="input" placeholder="Your full name"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                    <input type="email" className="input" placeholder="your@email.com"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input className="input" placeholder="+977 98XXXXXXXX"
                      value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                    <select className="input" value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                      <option value="">Select a topic</option>
                      <option value="Course Inquiry">Course Inquiry</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Payment Issue">Payment Issue</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                    <textarea className="input resize-none" rows={5}
                      placeholder="Tell us how we can help you..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>
                </div>

                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={!form.name || !form.email || !form.subject || !form.message || submitMutation.isPending}
                  className="btn-primary w-full mt-5 py-3 text-base">
                  {submitMutation.isPending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
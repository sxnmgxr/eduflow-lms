import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { Mail, CheckCircle } from 'lucide-react'

export default function NewsletterWidget() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const subscribeMutation = useMutation({
    mutationFn: () => api.post('/cms/newsletter/subscribe', { email, name }),
    onSuccess: () => { toast.success('Subscribed!'); setSubscribed(true) },
    onError: () => toast.error('Subscription failed'),
  })

  if (subscribed) return (
    <div className="bg-indigo-600 rounded-3xl p-10 text-center">
      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={28} className="text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">You're subscribed!</h3>
      <p className="text-indigo-200">We'll send you the latest updates and tutorials.</p>
    </div>
  )

  return (
    <div className="bg-indigo-600 rounded-3xl p-10 text-center">
      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail size={28} className="text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Stay in the loop</h3>
      <p className="text-indigo-200 mb-6">
        Get the latest tutorials, course updates and learning tips delivered to your inbox.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          className="flex-1 px-4 py-3 rounded-xl bg-white/20 text-white placeholder-indigo-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          className="flex-1 px-4 py-3 rounded-xl bg-white/20 text-white placeholder-indigo-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={() => subscribeMutation.mutate()}
          disabled={!email || subscribeMutation.isPending}
          className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors whitespace-nowrap">
          {subscribeMutation.isPending ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>
    </div>
  )
}
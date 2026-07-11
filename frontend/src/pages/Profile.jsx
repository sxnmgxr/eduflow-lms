import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import Navbar from '../components/ui/Navbar'
import toast from 'react-hot-toast'
import { Camera, Save, Lock } from 'lucide-react'

export default function Profile() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState({ name: user?.name || '', bio: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' })

  useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/me').then(r => {
      setForm({ name: r.data.user.name, bio: r.data.user.bio || '' })
      return r.data.user
    }),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/users/me', data),
    onSuccess: ({ data }) => {
      setAuth(data.user, accessToken, refreshToken)
      toast.success('Profile updated!')
      qc.invalidateQueries(['profile'])
    },
    onError: () => toast.error('Update failed'),
  })

  const passwordMutation = useMutation({
    mutationFn: () => api.put('/users/me/password', {
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    }),
    onSuccess: () => {
      toast.success('Password changed!')
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirm)
      return toast.error('Passwords do not match')
    if (passwords.newPassword.length < 8)
      return toast.error('Password must be at least 8 characters')
    passwordMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-display font-bold text-gray-900 mb-8">Account Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
          {['profile', 'password'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all
                ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'profile' ? 'Profile' : 'Password'}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="card p-8">
            {/* Avatar */}
            <div className="flex items-center gap-5 mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-indigo-600">
                  {user?.avatar_url
                    ? <img src={user.avatar_url} className="w-20 h-20 rounded-2xl object-cover" alt="" />
                    : user?.name?.charAt(0)
                  }
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow">
                  <Camera size={13} className="text-white" />
                </button>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input className="input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea className="input resize-none" rows={4}
                  placeholder="Tell students about yourself..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input className="input bg-gray-50" value={user?.email} disabled />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <button
                onClick={() => updateMutation.mutate(form)}
                disabled={updateMutation.isPending}
                className="btn-primary flex items-center gap-2">
                <Save size={16} />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Lock size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Change Password</p>
                <p className="text-sm text-gray-500">Use a strong password you don't use elsewhere</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                <input type="password" className="input"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <input type="password" className="input"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  required minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <input type="password" className="input"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  required />
              </div>
              <button type="submit" disabled={passwordMutation.isPending} className="btn-primary">
                {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import {
  GraduationCap, Search, Bell, ChevronDown,
  User, LogOut, Settings, X
} from 'lucide-react'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [searchQ, setSearchQ] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const debouncedSearch = useDebounce(searchQ, 300)
  const searchRef = useRef(null)

  const { data: searchResults } = useQuery({
    queryKey: ['search', debouncedSearch],
    queryFn: () => api.get('/search', { params: { q: debouncedSearch } }).then(r => r.data),
    enabled: debouncedSearch.length >= 2,
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/users/notifications').then(r => r.data),
    refetchInterval: 30000,
    enabled: !!user,
  })

  const readAllMutation = useMutation({
    mutationFn: () => api.patch('/users/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  })

  const unreadCount = notifData?.notifications?.filter(n => !n.is_read).length || 0

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 sticky top-0 z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-4">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <GraduationCap size={18} className="text-white" />
        </div>
        <span className="font-display font-bold text-gray-900">EduFlow</span>
      </Link>

      {/* Search */}
      <div className="relative flex-1 max-w-lg" ref={searchRef}>
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-10 py-2 text-sm w-full"
          placeholder="Search courses, instructors..."
          value={searchQ}
          onChange={(e) => { setSearchQ(e.target.value); setShowSearch(true) }}
          onFocus={() => setShowSearch(true)}
        />
        {searchQ && (
          <button onClick={() => { setSearchQ(''); setShowSearch(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}

        {/* Search dropdown */}
        {showSearch && debouncedSearch.length >= 2 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
            {!searchResults?.courses?.length && !searchResults?.instructors?.length ? (
              <div className="p-6 text-center text-gray-400 text-sm">No results found</div>
            ) : (
              <div className="p-2">
                {searchResults?.courses?.length > 0 && (
                  <>
                    <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Courses</p>
                    {searchResults.courses.map(c => (
                      <Link key={c.id} to={`/courses/${c.slug}`}
                        onClick={() => { setShowSearch(false); setSearchQ('') }}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors">
                        <img src={c.thumbnail_url || 'https://placehold.co/40x40?text=C'}
                          className="w-10 h-10 rounded-lg object-cover" alt="" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{c.title}</p>
                          <p className="text-xs text-gray-500">{c.instructor_name}</p>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {user ? (
          <>
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { setShowNotif(!showNotif); setShowProfile(false) }}
                className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-900">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={() => readAllMutation.mutate()}
                        className="text-xs text-indigo-600 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {!notifData?.notifications?.length ? (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        <Bell size={32} className="mx-auto mb-2 opacity-30" />
                        No notifications yet
                      </div>
                    ) : notifData.notifications.map(n => (
                      <div key={n.id}
                        className={`px-4 py-3 border-b border-gray-50 last:border-0
                          ${!n.is_read ? 'bg-indigo-50/50' : ''}`}>
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile menu */}
            <div className="relative">
              <button onClick={() => { setShowProfile(!showProfile); setShowNotif(false) }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                  {user.avatar_url
                    ? <img src={user.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                    : <span className="text-indigo-600 font-semibold text-xs">{user.name?.charAt(0)}</span>
                  }
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name?.split(' ')[0]}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <Link to="/profile"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                      <User size={16} /> Profile
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin"
                        onClick={() => setShowProfile(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                        <Settings size={16} /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); navigate('/login') }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl w-full">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Get started</Link>
          </>
        )}
      </div>
    </nav>
  )
}
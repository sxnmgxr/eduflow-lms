import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  BookOpen, LayoutDashboard, Library,
  LogOut, GraduationCap, User, Award, CreditCard, Gift, ShoppingBag, FileText, Calendar, Video, QrCode
} from 'lucide-react'

export default function StudentLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/my-courses', icon: BookOpen, label: 'My Courses' },
  { to: '/dashboard/catalog', icon: Library, label: 'Catalog' },
  { to: '/dashboard/live-classes', icon: Video, label: 'Live Classes' },
  { to: '/dashboard/certificates', icon: Award, label: 'Certificates' },
  { to: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { to: '/dashboard/qr-payment', icon: QrCode, label: 'QR Payment' },
  { to: '/dashboard/affiliate', icon: Gift, label: 'Affiliate' },
  { to: '/shop', icon: ShoppingBag, label: 'Book Store' },
  { to: '/blog', icon: FileText, label: 'Blog' },
  { to: '/events', icon: Calendar, label: 'Events' },
]

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">EduFlow</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-1">
          <NavLink to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`
            }>
            <User size={18} />
            Profile
          </NavLink>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
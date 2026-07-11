import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, BookOpen, Users, LogOut,
  GraduationCap, Shield, Tag, CreditCard,
  Video, FileText, UserPlus, Newspaper
} from 'lucide-react'

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/categories', icon: Tag, label: 'Categories' },
    { to: '/admin/live-classes', icon: Video, label: 'Live Classes' },
    { to: '/admin/qr-payments', icon: CreditCard, label: 'QR Payments' },
    { to: '/admin/bulk-enroll', icon: UserPlus, label: 'Bulk Enroll' },
    { to: '/admin/blogs', icon: FileText, label: 'Blogs' },
    { to: '/admin/newsletter', icon: Newspaper, label: 'Newsletter' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f9fafb' }}>
      <aside style={{ width: '220px', background: '#111827', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#6366f1', padding: '7px', borderRadius: '10px' }}>
              <GraduationCap size={18} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>EduFlow</div>
              <div style={{ color: '#818cf8', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Shield size={9} /> Admin
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '9px 12px', borderRadius: '9px', textDecoration: 'none',
                fontSize: '13px', fontWeight: 500,
                background: isActive ? '#6366f1' : 'transparent',
                color: isActive ? 'white' : '#9ca3af',
              })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid #374151' }}>
          <button onClick={() => { logout(); navigate('/login') }}
            style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: '9px 12px', borderRadius: '9px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '13px', fontWeight: 500 }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
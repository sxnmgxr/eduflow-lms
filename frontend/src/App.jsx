import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Auth
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'

// Student
import StudentDashboard from './pages/student/Dashboard'
import MyCourses from './pages/student/MyCourses'
import CourseCatalog from './pages/student/CourseCatalog'
import Certificates from './pages/student/Certificates'
import PaymentHistory from './pages/student/PaymentHistory'
import AffiliatePage from './pages/student/Affiliate'
import QRPayment from './pages/student/QRPayment'
import StudentLiveClasses from './pages/student/LiveClasses'
import QuizAttempt from './pages/student/Quizzes'

// Instructor
import InstructorOverview from './pages/instructor/Overview'
import InstructorCourses from './pages/instructor/MyCourses'
import CreateCourse from './pages/instructor/CreateCourse'
import EditCourse from './pages/instructor/EditCourse'
import QuizBuilder from './pages/instructor/QuizBuilder'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminCourses from './pages/admin/Courses'
import AdminUsers from './pages/admin/Users'
import AdminCategories from './pages/admin/Categories'
import AdminLiveClasses from './pages/admin/LiveClasses'
import QRPayments from './pages/admin/QRPayments'
import BulkEnroll from './pages/admin/BulkEnroll'
import AdminProducts from './pages/admin/Products'
import Finance from './pages/admin/Finance'
import AdminAffiliates from './pages/admin/Affiliates'
import AdminBlogs from './pages/admin/Blogs'
import AdminCMS from './pages/admin/CMS'
import InstallmentPlans from './pages/admin/InstallmentPlans'

// Public
import PublicBlog from './pages/PublicBlog'
import BlogPost from './pages/BlogPost'
import PublicEvents from './pages/PublicEvents'
import PublicTestimonials from './pages/PublicTestimonials'
import ConsultationPage from './pages/ConsultationPage'
import Shop from './pages/Shop'

// Payments
import PaymentVerify from './pages/PaymentVerify'
import EsewaPayment from './pages/EsewaPayment'
import EsewaSuccess from './pages/EsewaSuccess'
import EsewaFailure from './pages/EsewaFailure'

// Layouts
import StudentLayout from './layouts/StudentLayout'
import AdminLayout from './layouts/AdminLayout'
import InstructorLayout from './layouts/InstructorLayout'

// Components
import AIChatbot from './components/ui/AIChatbot'

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { user } = useAuthStore()

  const getHome = () => {
    if (!user) return '/login'
    if (user.role === 'admin') return '/admin'
    if (user.role === 'instructor') return '/instructor'
    return '/dashboard'
  }

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to={getHome()} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={getHome()} replace /> : <Register />} />
        <Route path="/blog" element={<PublicBlog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/events" element={<PublicEvents />} />
        <Route path="/testimonials" element={<PublicTestimonials />} />
        <Route path="/consultation" element={<ConsultationPage />} />
        <Route path="/shop" element={<Shop />} />

        {/* Payments */}
        <Route path="/payment/verify" element={<ProtectedRoute><PaymentVerify /></ProtectedRoute>} />
        <Route path="/pay/esewa/:courseId" element={<ProtectedRoute><EsewaPayment /></ProtectedRoute>} />
        <Route path="/esewa/success" element={<ProtectedRoute><EsewaSuccess /></ProtectedRoute>} />
        <Route path="/esewa/failure" element={<EsewaFailure />} />

        {/* Quiz */}
        <Route path="/quiz/:quizId" element={<ProtectedRoute><QuizAttempt /></ProtectedRoute>} />

        {/* Profile */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Student */}
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['student', 'instructor', 'admin']}>
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="catalog" element={<CourseCatalog />} />
          <Route path="live-classes" element={<StudentLiveClasses />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="payments" element={<PaymentHistory />} />
          <Route path="qr-payment" element={<QRPayment />} />
          <Route path="affiliate" element={<AffiliatePage />} />
        </Route>

        {/* Instructor */}
        <Route path="/instructor" element={
          <ProtectedRoute roles={['instructor', 'admin']}>
            <InstructorLayout />
          </ProtectedRoute>
        }>
          <Route index element={<InstructorOverview />} />
          <Route path="courses" element={<InstructorCourses />} />
          <Route path="courses/new" element={<CreateCourse />} />
          <Route path="courses/:id/edit" element={<EditCourse />} />
          <Route path="courses/:courseId/quiz" element={<QuizBuilder />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="live-classes" element={<AdminLiveClasses />} />
          <Route path="qr-payments" element={<QRPayments />} />
          <Route path="bulk-enroll" element={<BulkEnroll />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="finance" element={<Finance />} />
          <Route path="affiliates" element={<AdminAffiliates />} />
          <Route path="blogs" element={<AdminBlogs />} />
          <Route path="cms" element={<AdminCMS />} />
          <Route path="installments" element={<InstallmentPlans />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
              <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
              <a href="/" className="btn-primary inline-block">Go home</a>
            </div>
          </div>
        } />
      </Routes>

      {/* Global AI Chatbot */}
      <AIChatbot />
    </>
  )
}
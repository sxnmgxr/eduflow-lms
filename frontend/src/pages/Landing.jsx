import { Link } from 'react-router-dom'
import {
  GraduationCap, Play, Users, BookOpen,
  Star, ArrowRight, CheckCircle, Zap, Globe, Award
} from 'lucide-react'
import NewsletterWidget from '../components/ui/NewsletterWidget'

const features = [
  { icon: Play, title: 'HD Video Streaming', desc: 'Smooth HLS streaming that adapts to your connection speed automatically.' },
  { icon: Zap, title: 'Track Your Progress', desc: 'Pick up exactly where you left off. Every lesson progress is saved.' },
  { icon: Globe, title: 'Learn Anywhere', desc: 'Access your courses on any device — desktop, tablet or mobile.' },
  { icon: Award, title: 'Earn Certificates', desc: 'Get a certificate of completion for every course you finish.' },
]

const categories = [
  { name: 'DevOps & Cloud', emoji: '☁️' },
  { name: 'Web Development', emoji: '🌐' },
  { name: 'Data Science', emoji: '📊' },
  { name: 'Cybersecurity', emoji: '🔐' },
  { name: 'Mobile Dev', emoji: '📱' },
  { name: 'AI & ML', emoji: '🤖' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">EduFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#categories" className="hover:text-gray-900 transition-colors">Categories</a>
            <Link to="/dashboard/catalog" className="hover:text-gray-900 transition-colors">Courses</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-28 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium mb-8">
          <Star size={14} fill="currentColor" />
          Open Source Learning Platform
        </div>
        <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
          Learn skills that<br />
          <span className="text-indigo-600">get you hired.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Expert-led courses in DevOps, Cloud, and Engineering.
          Stream HD video lessons, track progress, and earn certificates.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2">
            Start learning for free <ArrowRight size={18} />
          </Link>
          <Link to="/dashboard/catalog" className="btn-secondary text-base px-8 py-3.5 flex items-center gap-2">
            <Play size={16} fill="currentColor" />
            Browse courses
          </Link>
        </div>
        <div className="flex items-center justify-center gap-6 mt-10 text-sm text-gray-400">
          {['No credit card required', 'Free forever plan', 'Cancel anytime'].map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-green-500" />
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '10,000+', label: 'Active Students' },
            { value: '500+', label: 'Expert Courses' },
            { value: '4.9★', label: 'Average Rating' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-4xl font-bold text-white mb-1">{value}</div>
              <div className="text-indigo-200">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to learn</h2>
          <p className="text-gray-500 text-lg">Built for modern learners and instructors</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-2xl mb-4">
                <Icon size={24} className="text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Browse by category</h2>
            <p className="text-gray-500">Find the perfect course for your career goals</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map(({ name, emoji }) => (
              <Link key={name} to="/dashboard/catalog"
                className="card p-5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="text-3xl mb-2">{emoji}</div>
                <div className="text-xs font-medium text-gray-700">{name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-4xl mx-auto px-6 py-16">
      <NewsletterWidget />
      </section>  

      {/* CTA */} 
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="bg-indigo-600 rounded-3xl p-16">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to start learning?</h2>
          <p className="text-indigo-200 text-lg mb-8">Join thousands of students already learning on EduFlow</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors">
            Get started for free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

            <footer className="border-t border-gray-100 py-12">
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid grid-cols-4 gap-8 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">EduFlow</span>
        </div>
        <p className="text-sm text-gray-500">Open source LMS platform built for modern learners.</p>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Platform</h4>
        <div className="space-y-2">
          {[
            { to: '/dashboard/catalog', label: 'Courses' },
            { to: '/blog', label: 'Blog' },
            { to: '/events', label: 'Events' },
            { to: '/shop', label: 'Book Store' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="block text-sm text-gray-500 hover:text-gray-700">{label}</Link>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Support</h4>
        <div className="space-y-2">
          {[
            { to: '/consultation', label: 'Consultation' },
            { to: '/testimonials', label: 'Testimonials' },
            { to: '/login', label: 'Sign In' },
            { to: '/register', label: 'Get Started' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="block text-sm text-gray-500 hover:text-gray-700">{label}</Link>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Connect</h4>
        <div className="space-y-2">
          <a href="https://github.com/sxnmgxr" target="_blank" rel="noreferrer"
            className="block text-sm text-gray-500 hover:text-gray-700">GitHub</a>
          <a href="mailto:sujanmagar0563@gmail.com"
            className="block text-sm text-gray-500 hover:text-gray-700">Email</a>
          <a href="https://linkedin.com/in/sxnmgxr" target="_blank" rel="noreferrer"
            className="block text-sm text-gray-500 hover:text-gray-700">LinkedIn</a>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-100 pt-6 flex items-center justify-between text-sm text-gray-400">
      <span>© {new Date().getFullYear()} EduFlow. Open Source LMS.</span>
      <span>Built with ❤️ in Nepal</span>
    </div>
  </div>
</footer>

    </div>
  )
}
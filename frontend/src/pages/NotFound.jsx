import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-6">
      <div className="bg-indigo-600 p-4 rounded-2xl mb-6">
        <GraduationCap size={32} className="text-white" />
      </div>
      <h1 className="text-8xl font-display font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-500 mb-8">Oops! This page doesn't exist.</p>
      <Link to="/" className="btn-primary">Go back home</Link>
    </div>
  )
}
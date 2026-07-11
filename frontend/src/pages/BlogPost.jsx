import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Navbar from '../components/ui/Navbar'
import { Calendar, Eye, ArrowLeft, User, Tag } from 'lucide-react'

export default function BlogPost() {
  const { slug } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => api.get(`/blogs/${slug}`).then(r => r.data),
  })

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!data?.blog) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="text-center py-32 text-gray-400">Blog post not found</div>
    </div>
  )

  const { blog } = data

  // Simple markdown-like rendering
  const renderContent = (content) => {
    if (!content) return ''
    return content
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-gray-900 mt-5 mb-2">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-indigo-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 text-gray-700">• $1</li>')
      .replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mt-4">')
      .replace(/^(?!<[h|l])/gm, '<p class="text-gray-700 leading-relaxed mt-4">')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/blog" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 text-sm">
          <ArrowLeft size={16} /> Back to Blog
        </Link>

        {/* Header */}
        <div className="mb-8">
          {blog.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {blog.tags.map(tag => (
                <span key={tag} className="badge bg-indigo-50 text-indigo-600 text-xs">
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">{blog.title}</h1>
          {blog.excerpt && (
            <p className="text-xl text-gray-500 mb-6 leading-relaxed">{blog.excerpt}</p>
          )}
          <div className="flex items-center gap-5 text-sm text-gray-500 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <User size={14} className="text-indigo-600" />
              </div>
              <span>{blog.author_name || 'EduFlow Team'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(blog.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <Eye size={14} /> {blog.views} views
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        {blog.thumbnail_url && (
          <img src={blog.thumbnail_url} alt={blog.title}
            className="w-full h-80 object-cover rounded-2xl mb-8" />
        )}

        {/* Content */}
        <article
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: renderContent(blog.content) }}
        />

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <Link to="/blog" className="btn-secondary text-sm flex items-center gap-2">
              <ArrowLeft size={15} /> More Articles
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              Share this article:
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                className="text-indigo-600 hover:text-indigo-700 font-medium">
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
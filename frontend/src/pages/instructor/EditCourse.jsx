import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  Plus, ChevronDown, Trash2, Video, FileText,
  ArrowLeft, Upload, CheckCircle, Eye, Loader2,
  Clock, AlertCircle, RefreshCw
} from 'lucide-react'

// Transcoding status badge
function TranscodeStatus({ lessonId, hasHls }) {
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState(hasHls ? 'done' : 'pending')

  const { data: jobStatus } = useQuery({
    queryKey: ['transcode-status', jobId],
    queryFn: () => api.get(`/lessons/transcode/${jobId}/status`).then(r => r.data),
    enabled: !!jobId && status !== 'done' && status !== 'failed',
    refetchInterval: 3000,
  })

  useEffect(() => {
    if (jobStatus) {
      setStatus(jobStatus.state)
      if (jobStatus.state === 'completed') {
        setStatus('done')
        setJobId(null)
      }
    }
  }, [jobStatus])

  if (status === 'done' || hasHls) return (
    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
      <CheckCircle size={11} /> Ready
    </span>
  )

  if (status === 'active') return (
    <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
      <Loader2 size={11} className="animate-spin" />
      Processing {jobStatus?.progress || 0}%
    </span>
  )

  if (status === 'failed') return (
    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <AlertCircle size={11} /> Failed
    </span>
  )

  return (
    <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
      <Clock size={11} /> Queued
    </span>
  )
}

export default function EditCourse() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [expandedSection, setExpandedSection] = useState(null)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [addingLessonTo, setAddingLessonTo] = useState(null)
  const [lessonForm, setLessonForm] = useState({
    title: '', description: '', is_preview: false, type: 'video'
  })
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const { data: myCourses } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => api.get('/courses/my/list').then(r => r.data.courses),
  })
  const courseMeta = myCourses?.find(c => c.id === id)

  const { data: course, refetch } = useQuery({
    queryKey: ['course-edit', id],
    queryFn: async () => {
      if (!courseMeta?.slug) return null
      const { data } = await api.get(`/courses/${courseMeta.slug}`)
      return data
    },
    enabled: !!courseMeta?.slug,
  })

  const addSectionMutation = useMutation({
    mutationFn: () => api.post('/sections', { course_id: id, title: newSectionTitle }),
    onSuccess: () => { setNewSectionTitle(''); refetch(); toast.success('Section added') },
    onError: () => toast.error('Failed to add section'),
  })

  const deleteSectionMutation = useMutation({
    mutationFn: (sId) => api.delete(`/sections/${sId}`),
    onSuccess: () => { refetch(); toast.success('Section removed') },
  })

  const addLessonMutation = useMutation({
    mutationFn: async (sectionId) => {
      let video_key = null
      let duration_seconds = 0

      if (uploadFile && lessonForm.type === 'video') {
        setUploading(true)
        setUploadProgress(0)

        // 1. Get presigned URL
        const { data: presigned } = await api.post('/lessons/upload-url', {
          fileName: uploadFile.name,
          fileType: uploadFile.type,
        })

        // 2. Upload to S3 with progress tracking via XMLHttpRequest
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100))
            }
          }
          xhr.onload = () => xhr.status < 400 ? resolve() : reject(new Error('Upload failed'))
          xhr.onerror = () => reject(new Error('Upload failed'))
          xhr.open('PUT', presigned.uploadUrl)
          xhr.setRequestHeader('Content-Type', uploadFile.type)
          xhr.send(uploadFile)
        })

        video_key = presigned.key
        duration_seconds = await getVideoDuration(uploadFile)
        setUploading(false)
      }

      // 3. Create lesson record
      const { data: lessonData } = await api.post('/lessons', {
        section_id: sectionId,
        course_id: id,
        title: lessonForm.title,
        description: lessonForm.description,
        type: lessonForm.type,
        video_key,
        duration_seconds,
        is_preview: lessonForm.is_preview,
      })

      // 4. Queue transcoding if video was uploaded
      if (video_key) {
        await api.post('/lessons/transcode', {
          lessonId: lessonData.lesson.id,
          videoKey: video_key,
        })
      }

      return lessonData
    },
    onSuccess: () => {
      setAddingLessonTo(null)
      setLessonForm({ title: '', description: '', is_preview: false, type: 'video' })
      setUploadFile(null)
      setUploadProgress(0)
      refetch()
      toast.success(uploadFile
        ? 'Lesson added! Video is being processed in background 🎬'
        : 'Lesson added!'
      )
    },
    onError: (err) => {
      setUploading(false)
      toast.error(err.response?.data?.message || 'Failed to add lesson')
    },
  })

  const deleteLessonMutation = useMutation({
    mutationFn: (lId) => api.delete(`/lessons/${lId}`),
    onSuccess: () => { refetch(); toast.success('Lesson removed') },
  })

  const publishMutation = useMutation({
    mutationFn: () => api.put(`/courses/${id}`, { is_published: !course?.is_published }),
    onSuccess: () => {
      refetch()
      toast.success(course?.is_published ? 'Course unpublished' : 'Course published! 🎉')
    },
  })

  const getVideoDuration = (file) => new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(Math.round(video.duration))
    }
    video.onerror = () => resolve(0)
    video.src = URL.createObjectURL(file)
  })

  if (!course) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => navigate('/instructor/courses')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} /> Back to courses
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-500 mt-1 text-sm">{course.short_description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`badge text-xs ${course.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {course.is_published ? '● Published' : '○ Draft'}
            </span>
            <span className="text-xs text-gray-400">
              {course.sections?.reduce((a, s) => a + (s.lessons?.length || 0), 0)} lessons
            </span>
          </div>
        </div>
        <button onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending}
          className={course.is_published ? 'btn-secondary' : 'btn-primary'}>
          {publishMutation.isPending
            ? 'Saving...'
            : course.is_published ? 'Unpublish' : 'Publish Course'
          }
        </button>
      </div>

      {/* Add section */}
      <div className="card p-4 mb-6 flex gap-3">
        <input className="input flex-1" placeholder="New section title (e.g. Getting Started)"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && newSectionTitle && addSectionMutation.mutate()}
        />
        <button
          onClick={() => addSectionMutation.mutate()}
          disabled={!newSectionTitle || addSectionMutation.isPending}
          className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={16} />
          {addSectionMutation.isPending ? 'Adding...' : 'Add Section'}
        </button>
      </div>

      {/* Sections list */}
      <div className="space-y-4">
        {!course.sections?.length && (
          <div className="card p-16 text-center text-gray-400">
            <Video size={40} className="mx-auto mb-3 opacity-20" />
            <p>No sections yet. Add your first section above.</p>
          </div>
        )}

        {course.sections?.map((section) => (
          <div key={section.id} className="card overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
              <button
                className="flex items-center gap-3 flex-1 text-left"
                onClick={() => setExpandedSection(
                  expandedSection === section.id ? null : section.id
                )}>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`} />
                <span className="font-semibold text-gray-900">{section.title}</span>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                  {section.lessons?.length || 0} lessons
                </span>
              </button>
              <button onClick={() => deleteSectionMutation.mutate(section.id)}
                className="text-gray-300 hover:text-red-500 transition-colors p-1">
                <Trash2 size={16} />
              </button>
            </div>

            {expandedSection === section.id && (
              <div className="p-4 space-y-2">
                {/* Lessons */}
                {section.lessons?.map((lesson) => (
                  <div key={lesson.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0">
                      {lesson.type === 'video'
                        ? <Video size={15} className="text-indigo-500" />
                        : <FileText size={15} className="text-gray-400" />
                      }
                    </div>
                    <span className="flex-1 text-sm text-gray-800">{lesson.title}</span>

                    <div className="flex items-center gap-2">
                      {lesson.is_preview && (
                        <span className="badge bg-indigo-50 text-indigo-600 text-xs">
                          <Eye size={10} /> Preview
                        </span>
                      )}
                      {lesson.type === 'video' && (
                        <TranscodeStatus
                          lessonId={lesson.id}
                          hasHls={!!lesson.hls_key}
                        />
                      )}
                      {lesson.duration_seconds > 0 && (
                        <span className="text-xs text-gray-400">
                          {Math.floor(lesson.duration_seconds / 60)}m {lesson.duration_seconds % 60}s
                        </span>
                      )}
                      <button onClick={() => deleteLessonMutation.mutate(lesson.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add lesson form */}
                {addingLessonTo === section.id ? (
                  <div className="mt-3 p-5 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-4">
                    <h4 className="font-medium text-gray-900 text-sm">Add New Lesson</h4>

                    {/* Lesson type selector */}
                    <div className="flex gap-2">
                      {['video', 'text'].map(type => (
                        <button key={type}
                          onClick={() => setLessonForm({ ...lessonForm, type })}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all
                            ${lessonForm.type === type
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                          {type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                          {type === 'video' ? 'Video Lesson' : 'Text Lesson'}
                        </button>
                      ))}
                    </div>

                    <input className="input" placeholder="Lesson title"
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />

                    <textarea className="input resize-none" rows={2}
                      placeholder="Short description (optional)"
                      value={lessonForm.description}
                      onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} />

                    {/* Video upload area */}
                    {lessonForm.type === 'video' && (
                      <div>
                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all
                          ${uploadFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:bg-white hover:border-indigo-300'}`}>
                          {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 size={24} className="text-indigo-500 animate-spin" />
                              <span className="text-sm text-indigo-600 font-medium">
                                Uploading... {uploadProgress}%
                              </span>
                              <div className="w-48 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${uploadProgress}%` }} />
                              </div>
                            </div>
                          ) : uploadFile ? (
                            <div className="flex flex-col items-center gap-1 text-green-600">
                              <CheckCircle size={24} />
                              <span className="text-sm font-medium">{uploadFile.name}</span>
                              <span className="text-xs text-green-500">
                                {(uploadFile.size / 1024 / 1024).toFixed(1)} MB
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                              <Upload size={28} />
                              <span className="text-sm font-medium">Click to upload video</span>
                              <span className="text-xs">MP4, MOV, MKV up to 2GB</span>
                            </div>
                          )}
                          <input type="file" accept="video/*" className="hidden"
                            onChange={(e) => setUploadFile(e.target.files[0])}
                            disabled={uploading} />
                        </label>
                      </div>
                    )}

                    {/* Text lesson content */}
                    {lessonForm.type === 'text' && (
                      <textarea className="input resize-none" rows={6}
                        placeholder="Write your lesson content here (supports Markdown)..."
                        value={lessonForm.content || ''}
                        onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} />
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={lessonForm.is_preview}
                        onChange={(e) => setLessonForm({ ...lessonForm, is_preview: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600" />
                      <span className="text-sm text-gray-600">
                        Make this a <strong>free preview</strong> lesson (visible without enrollment)
                      </span>
                    </label>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => addLessonMutation.mutate(section.id)}
                        disabled={!lessonForm.title || addLessonMutation.isPending || uploading}
                        className="btn-primary text-sm flex items-center gap-2">
                        {uploading
                          ? <><Loader2 size={14} className="animate-spin" /> Uploading {uploadProgress}%</>
                          : addLessonMutation.isPending
                            ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                            : <><CheckCircle size={14} /> Save Lesson</>
                        }
                      </button>
                      <button
                        onClick={() => {
                          setAddingLessonTo(null)
                          setUploadFile(null)
                          setLessonForm({ title: '', description: '', is_preview: false, type: 'video' })
                        }}
                        disabled={uploading}
                        className="btn-secondary text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingLessonTo(section.id)}
                    className="w-full flex items-center justify-center gap-2 p-3 mt-2
                               text-sm text-indigo-600 hover:bg-indigo-50 rounded-xl
                               border-2 border-dashed border-indigo-200 transition-colors">
                    <Plus size={16} /> Add Lesson
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refresh button */}
      <button onClick={() => refetch()}
        className="mt-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <RefreshCw size={14} /> Refresh course data
      </button>
    </div>
  )
}
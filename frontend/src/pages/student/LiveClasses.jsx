import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { Video, ExternalLink, Calendar, Clock, Lock } from 'lucide-react'

export default function StudentLiveClasses() {
  const { data, isLoading } = useQuery({
    queryKey: ['upcoming-classes'],
    queryFn: () => api.get('/live-classes/upcoming').then(r => r.data),
  })

  const now = new Date()

  const getClassStatus = (scheduledAt, durationMinutes) => {
    const start = new Date(scheduledAt)
    const end = new Date(start.getTime() + durationMinutes * 60000)
    if (now >= start && now <= end) return 'live'
    if (now < start) return 'upcoming'
    return 'ended'
  }

  const statusConfig = {
    live: { label: '● LIVE NOW', color: 'bg-red-100 text-red-700', canJoin: true },
    upcoming: { label: 'Upcoming', color: 'bg-blue-50 text-blue-700', canJoin: false },
    ended: { label: 'Ended', color: 'bg-gray-100 text-gray-500', canJoin: false },
  }

  const platformIcon = {
    zoom: '🔵',
    google_meet: '🟢',
    other: '📹',
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <Video size={24} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-gray-500">Upcoming and active live sessions from your courses</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.liveClasses?.length ? (
        <div className="card p-16 text-center">
          <Video size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No upcoming live classes</p>
          <p className="text-sm text-gray-400">
            Live sessions from your enrolled courses will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.liveClasses.map(lc => {
            const classStatus = getClassStatus(lc.scheduled_at, lc.duration_minutes)
            const config = statusConfig[classStatus]

            return (
              <div key={lc.id} className={`card p-6 flex gap-5 ${classStatus === 'live' ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}>
                {/* Platform icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl
                  ${lc.platform === 'zoom' ? 'bg-blue-50' : lc.platform === 'google_meet' ? 'bg-green-50' : 'bg-gray-50'}`}>
                  {platformIcon[lc.platform] || '📹'}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge text-xs font-semibold ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="badge bg-gray-100 text-gray-600 text-xs capitalize">
                          {lc.platform === 'google_meet' ? 'Google Meet' : lc.platform}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{lc.title}</h3>
                      <p className="text-sm text-indigo-600 mt-0.5">{lc.course_title}</p>
                      {lc.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lc.description}</p>
                      )}
                    </div>

                    {/* Join button */}
                    {config.canJoin ? (
                      <a href={lc.meeting_url} target="_blank" rel="noreferrer"
                        className="btn-primary flex items-center gap-2 text-sm ml-4 flex-shrink-0 animate-pulse">
                        <ExternalLink size={15} /> Join Now
                      </a>
                    ) : classStatus === 'upcoming' ? (
                      <a href={lc.meeting_url} target="_blank" rel="noreferrer"
                        className="btn-secondary flex items-center gap-2 text-sm ml-4 flex-shrink-0">
                        <ExternalLink size={15} /> Open Link
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-400 ml-4 flex-shrink-0">
                        <Lock size={14} /> Session ended
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-5 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-400" />
                      {new Date(lc.scheduled_at).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-indigo-400" />
                      {new Date(lc.scheduled_at).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    <div className="text-gray-400">{lc.duration_minutes} min</div>
                    <div>by {lc.instructor_name}</div>
                  </div>

                  {/* Meeting details */}
                  {(lc.meeting_id || lc.passcode) && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2">
                      {lc.meeting_id && <span>Meeting ID: <strong className="text-gray-600">{lc.meeting_id}</strong></span>}
                      {lc.passcode && <span>Passcode: <strong className="text-gray-600">{lc.passcode}</strong></span>}
                    </div>
                  )}

                  {/* Recording */}
                  {lc.is_recorded && lc.recording_url && (
                    <div className="mt-3">
                      <a href={lc.recording_url} target="_blank" rel="noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5">
                        📹 Watch Recording
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
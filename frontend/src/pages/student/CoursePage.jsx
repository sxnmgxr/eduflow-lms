import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import VideoPlayer from '../../components/ui/VideoPlayer';
import { CheckCircle, Lock, Play, ChevronDown } from 'lucide-react';

export default function CoursePage() {
  const { slug } = useParams();
  const [activeLesson, setActiveLesson] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get(`/courses/${slug}`).then(r => r.data),
  });

  const loadLesson = async (lesson) => {
    if (!lesson.is_preview) {
      try {
        const { data } = await api.get(`/lessons/${lesson.id}/watch`);
        setVideoUrl(data.streamUrl);
        setActiveLesson(lesson);
      } catch {
        alert('Please enroll to watch this lesson');
      }
    } else {
      // Preview lessons don't need auth
      const { data } = await api.get(`/lessons/${lesson.id}/watch`);
      setVideoUrl(data.streamUrl);
      setActiveLesson(lesson);
    }
  };

  const handleProgress = async (seconds) => {
    if (!activeLesson) return;
    await api.post(`/lessons/${activeLesson.id}/progress`, {
      watched_seconds: seconds,
      course_id: course.id,
    }).catch(() => {});
  };

  const handleComplete = async () => {
    if (!activeLesson) return;
    await api.post(`/lessons/${activeLesson.id}/progress`, {
      watched_seconds: activeLesson.duration_seconds,
      is_completed: true,
      course_id: course.id,
    }).catch(() => {});
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Video area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {videoUrl ? (
            <>
              <VideoPlayer
                src={videoUrl}
                onProgress={handleProgress}
                onComplete={handleComplete}
                poster={course.thumbnail_url}
              />
              <h2 className="text-xl font-display font-bold mt-4">{activeLesson?.title}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{activeLesson?.description}</p>
            </>
          ) : (
            <div className="aspect-video bg-dark-bg rounded-xl flex flex-col items-center justify-center text-gray-400">
              <Play size={48} className="mb-3 opacity-30" />
              <p>Select a lesson to start learning</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar — Curriculum */}
      <div className="w-80 border-l border-gray-200 dark:border-dark-border overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="font-display font-bold text-lg">Course Content</h3>
          <p className="text-sm text-gray-500 mt-1">{course.total_lessons} lessons</p>
        </div>

        {course.sections?.map((section) => (
          <div key={section.id} className="border-b border-gray-100 dark:border-dark-border">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-card text-left"
              onClick={() => setExpandedSection(
                expandedSection === section.id ? null : section.id
              )}
            >
              <span className="font-medium text-sm">{section.title}</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedSection === section.id && (
              <div>
                {section.lessons?.map((lesson) => (
                  <button
                    key={lesson.id}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
                      ${activeLesson?.id === lesson.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'hover:bg-gray-50 dark:hover:bg-dark-card'
                      }`}
                    onClick={() => loadLesson(lesson)}
                  >
                    <div className="flex-shrink-0">
                      {lesson.is_preview
                        ? <Play size={14} className="text-primary-500" />
                        : <Lock size={14} className="text-gray-400" />
                      }
                    </div>
                    <span className="flex-1 line-clamp-2">{lesson.title}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {Math.floor(lesson.duration_seconds / 60)}m
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
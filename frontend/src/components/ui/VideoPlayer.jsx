import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

export default function VideoPlayer({ src, onProgress, onComplete, poster }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const progressRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [quality, setQuality] = useState('auto');
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef(null);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1, // auto quality
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
      });
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play().catch(() => {});
        setPlaying(true);
      });
      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      videoRef.current.src = src;
    }

    return () => {
      hlsRef.current?.destroy();
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
      // Report progress every 10 seconds
      if (Math.round(video.currentTime) % 10 === 0) {
        onProgress?.(Math.round(video.currentTime));
      }
    };

    const onDurationChange = () => setDuration(video.duration);
    const onEnded = () => { setPlaying(false); onComplete?.(); };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('ended', onEnded);
    };
  }, [onProgress, onComplete]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const handleFullscreen = () => {
    const wrapper = videoRef.current.parentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapper.requestFullscreen();
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  return (
    <div
      className="relative bg-black rounded-xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full aspect-video"
        onClick={togglePlay}
        playsInline
      />

      {/* Controls overlay */}
      <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10">

          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative h-1.5 bg-white/30 rounded-full cursor-pointer mb-3 group/bar"
            onClick={handleSeek}
          >
            <div
              className="absolute h-full bg-white/20 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            <div
              className="absolute h-full bg-primary-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity"
              style={{ left: `${(currentTime / duration) * 100 || 0}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-primary-400 transition-colors">
              {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <button onClick={toggleMute} className="text-white hover:text-primary-400 transition-colors">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <input
              type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                videoRef.current.volume = v;
                if (v === 0) setMuted(true); else setMuted(false);
              }}
              className="w-20 accent-primary-500"
            />

            <span className="text-white text-sm ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            <button onClick={handleFullscreen} className="text-white hover:text-primary-400 transition-colors">
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Play overlay when paused */}
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-5">
            <Play size={32} className="text-white" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
}
'use client'

import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, ChevronUp, Film } from 'lucide-react'

interface VideoPlayerProps {
  videoUrl: string
  thumbnailUrl?: string | null
  title: string
  format?: string
}

export function VideoPlayer({ videoUrl, thumbnailUrl, title, format = 'portrait' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [hasError, setHasError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [quality, setQuality] = useState('1080p')
  const [demoClicked, setDemoClicked] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleLoadedMetadata = () => setDuration(video.duration)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play().catch(() => setHasError(true))
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (videoRef.current) {
      videoRef.current.volume = vol
      setIsMuted(vol === 0)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pos * duration
  }

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
    setPlaybackSpeed(speed)
    setShowSettings(false)
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Always use 16:9 for the player area regardless of video format
  const isSampleVideo = videoUrl.startsWith('/uploads/sample-')

  if (hasError || isSampleVideo) {
    return (
      <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
            <Play className="h-12 w-12 text-zinc-600" />
          </div>
        )}
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-zinc-900/40" />
        {/* Demo content badge */}
        <div className="absolute top-3 left-3 px-2 py-0.5 bg-violet-600/80 text-white rounded text-[10px] font-bold uppercase tracking-wider">
          Demo
        </div>
        {!demoClicked ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer"
            onClick={() => setDemoClicked(true)}
          >
            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors">
              <Play className="h-7 w-7 text-white ml-0.5" />
            </div>
            <p className="text-white text-sm font-medium">Play Demo</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/60 animate-vert-fade-in">
            <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center">
              <Film className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="text-zinc-300 text-sm font-medium text-center px-6">Video playback will be available when real content is uploaded</p>
            <button
              onClick={() => setDemoClicked(false)}
              className="mt-2 px-3 py-1 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    )
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div ref={containerRef} className="relative aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl || undefined}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onError={() => setHasError(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Progress bar */}
        <div
          className="h-1 hover:h-1.5 bg-zinc-700 cursor-pointer transition-all mx-0"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-violet-600 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-violet-600 rounded-full opacity-0 group-hover:opacity-100" />
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 pb-2 pt-1">
          <button onClick={togglePlay} className="text-white hover:text-violet-400 transition-colors p-1">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button onClick={toggleMute} className="text-white hover:text-violet-400 transition-colors p-1">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-zinc-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>

          {/* Time */}
          <span className="text-xs text-zinc-300 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:text-violet-400 transition-colors p-1"
            >
              <Settings className="h-4 w-4" />
            </button>
            {showSettings && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-zinc-200 shadow-lg rounded-lg py-2 z-50">
                <p className="px-3 py-1 text-xs font-medium text-zinc-700 uppercase tracking-wider">Quality</p>
                {['1080p', '720p', '480p'].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuality(q); setShowSettings(false) }}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                      quality === q ? 'text-violet-600 bg-violet-50' : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {q}
                  </button>
                ))}
                <div className="border-t border-zinc-200 my-1" />
                <p className="px-3 py-1 text-xs font-medium text-zinc-700 uppercase tracking-wider">Speed</p>
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                      playbackSpeed === speed ? 'text-violet-600 bg-violet-50' : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {speed}x{speed === 1 ? ' (Normal)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white hover:text-violet-400 transition-colors p-1">
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Play button overlay when paused */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-14 h-14 rounded-full bg-zinc-900/50 flex items-center justify-center backdrop-blur-sm">
            <Play className="h-7 w-7 text-white ml-0.5" />
          </div>
        </div>
      )}
    </div>
  )
}

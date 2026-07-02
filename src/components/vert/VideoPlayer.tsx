'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Film } from 'lucide-react'
import Hls from 'hls.js'

interface VideoPlayerProps {
  videoUrl: string
  thumbnailUrl?: string | null
  title: string
  format?: string
}

type QualityLevel = {
  label: string
  /** Index passed to hls.currentLevel, or -1 for "Auto" */
  level: number
}

function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url)
}

function heightToLabel(h: number): string {
  if (h >= 2160) return '4K'
  if (h >= 1440) return '1440p'
  if (h >= 1080) return '1080p'
  if (h >= 720) return '720p'
  if (h >= 480) return '480p'
  if (h >= 360) return '360p'
  if (h >= 240) return '240p'
  if (h > 0) return `${h}p`
  return 'Source'
}

export function VideoPlayer({ videoUrl, thumbnailUrl, title, format = 'portrait' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [hasError, setHasError] = useState(false)
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Quality state — real values, populated from hls.js levels or the video element
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([])
  const [currentQuality, setCurrentQuality] = useState<number>(-1) // -1 = Auto
  const [sourceLabel, setSourceLabel] = useState<string>('Auto')

  const [demoClicked, setDemoClicked] = useState(false)

  // Reset error/quality state when the source URL changes — uses the
  // "store information from previous renders" pattern from the React docs
  // (https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  // to avoid calling setState synchronously inside an effect.
  const [prevUrl, setPrevUrl] = useState(videoUrl)
  if (prevUrl !== videoUrl) {
    setPrevUrl(videoUrl)
    setHasError(false)
    setQualityLevels([])
    setCurrentQuality(-1)
    setSourceLabel('Auto')
  }

  // --- Wire up the video element + hls.js when src changes ---
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let disposed = false

    // Cleanup any prior hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const onLoadedMeta = () => {
      setDuration(video.duration)
      // Capture actual video dimensions for proper aspect ratio
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoAspectRatio(video.videoWidth / video.videoHeight)
      }
    }
    const onTimeUpdate = () => setCurrentTime(video.currentTime)
    video.addEventListener('loadedmetadata', onLoadedMeta)
    video.addEventListener('timeupdate', onTimeUpdate)

    if (isHlsUrl(videoUrl)) {
      // Adaptive streaming path — use hls.js
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true })
        hlsRef.current = hls
        hls.loadSource(videoUrl)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          if (disposed) return
          // Build the quality menu from the actual levels
          const levels: QualityLevel[] = [
            { label: 'Auto', level: -1 },
            ...data.levels
              .map((lvl, idx) => ({
                label: lvl.height ? heightToLabel(lvl.height) : `Level ${idx + 1}`,
                level: idx,
              }))
              // Show highest first (matches YouTube convention)
              .reverse(),
          ]
          setQualityLevels(levels)
          setCurrentQuality(-1)
        })

        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          if (disposed) return
          const lvl = hls.levels[data.level]
          setSourceLabel(lvl?.height ? heightToLabel(lvl.height) : `Level ${data.level + 1}`)
        })

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setHasError(true)
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS — no level switching API exposed, expose a single
        // "Auto (native)" entry. This setState is gated on a capability check
        // that is stable per URL change, so it cannot trigger cascading renders.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQualityLevels([{ label: 'Auto (native)', level: -1 }])
        video.src = videoUrl
      } else {
        // HLS not supported at all — fall back to error UI.
        setHasError(true)
      }
    } else {
      // Progressive download — single source, no level switching.
      // setQualityLevels([]) is also called from the prevUrl block above; we
      // keep it here for clarity when the URL is the first one mounted.
      setQualityLevels([])
      video.src = videoUrl
      // Once metadata loads, label the quality based on the actual video height
      const onMetaForQuality = () => {
        if (disposed) return
        const h = (video as HTMLVideoElement & { videoHeight?: number }).videoHeight
        if (h && h > 0) {
          setSourceLabel(`${heightToLabel(h)} (source)`)
        } else {
          setSourceLabel('Source')
        }
      }
      video.addEventListener('loadedmetadata', onMetaForQuality, { once: true })
    }

    return () => {
      disposed = true
      video.removeEventListener('loadedmetadata', onLoadedMeta)
      video.removeEventListener('timeupdate', onTimeUpdate)
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [videoUrl])

  // --- Controls ---
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play().catch(() => setHasError(true))
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

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

  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      // -1 means auto-quality
      hlsRef.current.currentLevel = level
      setCurrentQuality(level)
      setSourceLabel(level === -1 ? 'Auto' : (qualityLevels.find((q) => q.level === level)?.label ?? 'Auto'))
    }
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

  // Demo placeholder for seeded sample URLs (these are intentionally fake in dev)
  const isSampleVideo = videoUrl.startsWith('/uploads/sample-')

  if (hasError || isSampleVideo) {
    return (
      <div className="w-full flex justify-center bg-zinc-900 rounded-lg overflow-hidden">
      <div
        className="relative bg-zinc-900 overflow-hidden"
        style={{
          aspectRatio: videoAspectRatio ? `${videoAspectRatio}` : '16/9',
          maxWidth: videoAspectRatio && videoAspectRatio < 1
            ? 'min(420px, 70vh)'
            : '100%',
          width: '100%',
        }}
      >
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
            <Play className="h-12 w-12 text-zinc-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-zinc-900/40" />
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
              className="mt-2 px-3 py-1 text-xs text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      </div>
    )
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="w-full flex justify-center bg-black rounded-lg overflow-hidden">
    <div
      ref={containerRef}
      className="relative bg-black overflow-hidden group"
      style={{
        aspectRatio: videoAspectRatio ? `${videoAspectRatio}` : '16/9',
        maxWidth: videoAspectRatio && videoAspectRatio < 1
          ? 'min(420px, 70vh)'  // portrait: cap width so height stays reasonable
          : '100%',              // landscape/square: full width
        width: videoAspectRatio && videoAspectRatio < 1
          ? 'auto'              // portrait: let maxWidth control the size
          : '100%',             // landscape/square: full width
      }}
    >
      <video
        ref={videoRef}
        poster={thumbnailUrl || undefined}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onError={() => setHasError(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

          <span className="text-xs text-zinc-300 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:text-violet-400 transition-colors p-1"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            {showSettings && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-zinc-200 shadow-lg rounded-lg py-2 z-50">
                {/* Quality section — only shown when HLS levels are available */}
                {qualityLevels.length > 0 ? (
                  <>
                    <p className="px-3 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Quality {currentQuality === -1 && sourceLabel !== 'Auto' && `· ${sourceLabel}`}
                    </p>
                    {qualityLevels.map((q) => (
                      <button
                        key={`${q.label}-${q.level}`}
                        onClick={() => handleQualityChange(q.level)}
                        className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                          currentQuality === q.level ? 'text-violet-600 bg-violet-50' : 'text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                    <div className="border-t border-zinc-200 my-1" />
                  </>
                ) : (
                  // Progressive download — single source, just show its label
                  <>
                    <p className="px-3 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">Quality</p>
                    <div className="px-3 py-1.5 text-sm text-zinc-700">{sourceLabel}</div>
                    <div className="border-t border-zinc-200 my-1" />
                  </>
                )}
                <p className="px-3 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">Speed</p>
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                      playbackSpeed === speed ? 'text-violet-600 bg-violet-50' : 'text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {speed}x{speed === 1 ? ' (Normal)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={toggleFullscreen} className="text-white hover:text-violet-400 transition-colors p-1" aria-label="Fullscreen">
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
    </div>
  )
}

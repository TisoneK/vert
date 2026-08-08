'use client'

import { useRef, useState, useEffect, useCallback, type CSSProperties } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Loader2 } from 'lucide-react'
import Hls from 'hls.js'
import { put } from '@vercel/blob/client'

/**
 * Keyboard shortcuts for the video player:
 * - Space or K: play/pause
 * - Left arrow: seek backward 5 seconds
 * - Right arrow: seek forward 5 seconds
 * - M: mute/unmute
 * - F: fullscreen
 * - Up arrow: volume up 10%
 * - Down arrow: volume down 10%
 * - J: seek backward 10 seconds
 * - L: seek forward 10 seconds
 * - 0-9: jump to 0%, 10%, ..., 90% of the video
 */
const SEEK_SHORT_STEP = 5 // seconds for left/right arrow
const SEEK_LONG_STEP = 10 // seconds for J/L keys
const VOLUME_STEP = 0.1 // 10% volume change per up/down arrow

interface VideoPlayerProps {
  videoUrl: string
  thumbnailUrl?: string | null
  title: string
  format?: string
  /** Video id — used for auto-backfilling a missing thumbnail. Optional
   *  because VideoPlayer is also used in contexts where the id isn't known. */
  videoId?: string
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

export function VideoPlayer({ videoUrl, thumbnailUrl, title, format = 'portrait', videoId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
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
  // Buffering state — true only while the video is waiting for data to download
  // before it can continue playing. Start false so metadata-only loading doesn't
  // trap the player behind a spinner; the waiting event turns it on when playback
  // actually stalls.
  const [isBuffering, setIsBuffering] = useState(false)
  // How much of the video has been downloaded, as a percentage (0–100).
  // Updated from the `progress` event reading video.buffered.
  const [bufferedPercent, setBufferedPercent] = useState(0)
  // Whether the controls overlay is currently visible. On desktop this is
  // driven by hover (group-hover:opacity-100); on mobile (no hover) we
  // toggle it on tap so the user can actually reach mute / fullscreen /
  // settings. The CSS combines both mechanisms: `opacity-0 group-hover:
  // opacity-100` for desktop and `controlsVisible ? 'opacity-100' : ...`
  // for mobile. The controls auto-hide after 3s of playback inactivity.
  const [controlsVisible, setControlsVisible] = useState(false)

  // Quality state — real values, populated from hls.js levels or the video element
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([])
  const [currentQuality, setCurrentQuality] = useState<number>(-1) // -1 = Auto
  const [sourceLabel, setSourceLabel] = useState<string>('Auto')

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
    // Reset buffering state for the new source — starts as "buffering" until
    // the first frame is ready.
    setIsBuffering(true)
    setBufferedPercent(0)
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
      // Metadata is enough to render the player and show its play affordance;
      // preload="metadata" intentionally does not guarantee a first frame yet.
      setIsBuffering(false)
      // Capture actual video dimensions for proper aspect ratio
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoAspectRatio(video.videoWidth / video.videoHeight)
      }
    }
    const onTimeUpdate = () => setCurrentTime(video.currentTime)

    // Buffering events — `waiting` fires when playback stalls waiting for
    // data, `playing` and `canplay` fire when enough data is available to
    // resume. `canplay` also covers the initial load (first frame ready).
    const onWaiting = () => setIsBuffering(true)
    const onCanPlay = () => setIsBuffering(false)
    const onPlaying = () => setIsBuffering(false)

    // Buffer progress — the `progress` event fires periodically as the browser
    // downloads data. We read video.buffered (a TimeRanges object) and compute
    // how far ahead of the playhead we've buffered, as a percentage of total
    // duration. This drives the lighter bar behind the violet progress bar.
    const onProgress = () => {
      if (video.buffered.length > 0 && video.duration > 0) {
        // Find the buffered range that contains (or is closest ahead of) the
        // current time — usually the last range for a progressive download,
        // but for HLS the ranges can be more fragmented.
        const lastBufferedEnd = video.buffered.end(video.buffered.length - 1)
        setBufferedPercent(Math.min(100, (lastBufferedEnd / video.duration) * 100))
      }
    }

    video.addEventListener('loadedmetadata', onLoadedMeta)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('progress', onProgress)

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
          if (data.fatal) {
            setIsBuffering(false)
            setHasError(true)
          }
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS — no level switching API exposed, expose a single
        // "Auto (native)" entry. This setState is gated on a capability check
        // that is stable per URL change, so it cannot trigger cascading renders.
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
      // External-system (HTMLMediaElement) setup sync — same rationale as the
      // disable above; gated on a stable per-URL branch, no cascading renders.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('progress', onProgress)
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [videoUrl])

  // --- Auto-backfill missing thumbnail ---
  // When a video has no thumbnail and the viewer is logged in, capture a
  // frame from the playing video, upload it to Vercel Blob, and POST it to
  // /api/v1/videos/[id]/thumbnail. The endpoint only writes if the video
  // still has no thumbnail, so concurrent viewers don't overwrite each other.
  // Best-effort: any error is silently ignored — this is a background nicety,
  // not a critical path.
  useEffect(() => {
    if (thumbnailUrl || !videoId) return
    const video = videoRef.current
    if (!video) return

    let cancelled = false
    let attempted = false

    const captureAndUpload = async () => {
      if (attempted) return
      attempted = true

      try {
        const w = video.videoWidth
        const h = video.videoHeight
        if (!w || !h) return

        const canvas = document.createElement('canvas')
        const maxDim = 720
        const scale = Math.min(1, maxDim / Math.max(w, h))
        canvas.width = Math.round(w * scale)
        canvas.height = Math.round(h * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.85)
        )
        if (!blob || cancelled) return

        // Get a client upload token from our server
        const tokenRes = await fetch(
          `/api/v1/upload?contentType=image/jpeg&filename=thumbnail.jpg`,
        )
        if (!tokenRes.ok) return
        const { token, pathname } = await tokenRes.json()

        // Upload to Vercel Blob
        const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
        const blobResult = await put(pathname, file, {
          access: 'public',
          contentType: 'image/jpeg',
          token,
        })
        if (cancelled) return

        // Patch the video record
        await fetch(`/api/v1/videos/${videoId}/thumbnail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thumbnailUrl: blobResult.url }),
        })
      } catch {
        // Silent failure — backfill is best-effort
      }
    }

    // Capture once the user has played past 1 second — gives us a real frame
    // that isn't a black lead-in.
    const onTimeUpdate = () => {
      if (video.currentTime >= 1 && !attempted) {
        captureAndUpload()
        video.removeEventListener('timeupdate', onTimeUpdate)
      }
    }
    // Fallback: if the video is short and ends before 1s, capture on pause
    const onPlay = () => {
      video.addEventListener('timeupdate', onTimeUpdate)
    }

    video.addEventListener('play', onPlay)
    return () => {
      cancelled = true
      video.removeEventListener('play', onPlay)
      video.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [thumbnailUrl, videoId, videoUrl])

  // Close the settings menu from Escape or when the user clicks outside it.
  useEffect(() => {
    if (!showSettings) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSettings(false)
        settingsButtonRef.current?.focus()
      }
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest('[data-video-settings]')) {
        setShowSettings(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [showSettings])

  // --- Controls ---
  // Auto-hide controls after 3s of inactivity while playing. Without this
  // the controls overlay would stay visible forever on mobile after a tap.
  // We only auto-hide while playing (paused users want to see controls).
  // NOTE: currentTime is intentionally NOT in the dependency array — if it
  // were, the 3-second timer would reset on every video timeupdate (~4 Hz),
  // which would make controls stay visible forever.
  useEffect(() => {
    if (!controlsVisible || !isPlaying) return
    const id = setTimeout(() => {
      // Don't hide if the settings menu is open — that would trap the user.
      if (!showSettings) setControlsVisible(false)
    }, 3000)
    return () => clearTimeout(id)
  }, [controlsVisible, isPlaying, showSettings])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play().catch(() => setHasError(true))
    }
  }, [isPlaying])

  // Toggle controls visibility — used by the video container's onClick.
  // Single tap: toggle controls (and let the play button do its thing).
  // We deliberately do NOT toggle play on container tap, because the big
  // play/pause button in the center overlay already handles that and doing
  // both makes the UI feel jumpy.
  const handleContainerTap = useCallback(() => {
    setControlsVisible((v) => !v)
  }, [])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [])

  // --- Keyboard shortcuts helper functions ---
  const seek = useCallback((seconds: number) => {
    if (!videoRef.current) return
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds))
    videoRef.current.currentTime = newTime
  }, [duration])

  const changeVolume = useCallback((delta: number) => {
    if (!videoRef.current) return
    const newVol = Math.max(0, Math.min(1, volume + delta))
    setVolume(newVol)
    videoRef.current.volume = newVol
    setIsMuted(newVol === 0)
  }, [volume])

  const jumpToPercent = useCallback((percent: number) => {
    if (!videoRef.current || !duration) return
    videoRef.current.currentTime = (percent / 100) * duration
  }, [duration])

  // --- Keyboard shortcuts effect ---
  // Handle keyboard events when the video container is focused.
  // The container has tabIndex={0} so it can receive focus.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Let native keyboard behavior handle controls and form fields. Otherwise,
      // pressing Space on a button would both click it and toggle playback via
      // this container-level shortcut.
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('button, input, select, textarea, a')
      ) return

      // Prevent default for our shortcuts to avoid page scrolling
      const shouldPreventDefault = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      if (shouldPreventDefault) e.preventDefault()

      switch (e.key) {
        case ' ': // Space - play/pause
        case 'k': // K - play/pause (YouTube-style)
        case 'K':
          togglePlay()
          break
        case 'ArrowLeft': // Left arrow - seek back 5s
          seek(-SEEK_SHORT_STEP)
          break
        case 'ArrowRight': // Right arrow - seek forward 5s
          seek(SEEK_SHORT_STEP)
          break
        case 'j': // J - seek back 10s (YouTube-style)
        case 'J':
          seek(-SEEK_LONG_STEP)
          break
        case 'l': // L - seek forward 10s (YouTube-style)
        case 'L':
          seek(SEEK_LONG_STEP)
          break
        case 'ArrowUp': // Up arrow - volume up
          changeVolume(VOLUME_STEP)
          break
        case 'ArrowDown': // Down arrow - volume down
          changeVolume(-VOLUME_STEP)
          break
        case 'm': // M - mute/unmute
        case 'M':
          toggleMute()
          break
        case 'f': // F - fullscreen
        case 'F':
          toggleFullscreen()
          break
        case '0': // Jump to 0%
          jumpToPercent(0)
          break
        case '1': // Jump to 10%
          jumpToPercent(10)
          break
        case '2': // Jump to 20%
          jumpToPercent(20)
          break
        case '3': // Jump to 30%
          jumpToPercent(30)
          break
        case '4': // Jump to 40%
          jumpToPercent(40)
          break
        case '5': // Jump to 50%
          jumpToPercent(50)
          break
        case '6': // Jump to 60%
          jumpToPercent(60)
          break
        case '7': // Jump to 70%
          jumpToPercent(70)
          break
        case '8': // Jump to 80%
          jumpToPercent(80)
          break
        case '9': // Jump to 90%
          jumpToPercent(90)
          break
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, seek, changeVolume, toggleMute, toggleFullscreen, jumpToPercent])

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (videoRef.current) {
      videoRef.current.volume = vol
      setIsMuted(vol === 0)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    videoRef.current.currentTime = pos * duration
  }

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return

    let nextTime = videoRef.current.currentTime
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') nextTime -= SEEK_SHORT_STEP
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') nextTime += SEEK_SHORT_STEP
    else if (e.key === 'Home') nextTime = 0
    else if (e.key === 'End') nextTime = duration
    else return

    e.preventDefault()
    videoRef.current.currentTime = Math.min(duration, Math.max(0, nextTime))
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

  // Once metadata is available, trust the media's real dimensions over the
  // database format hint. A mislabeled landscape source must not reserve a
  // portrait-height stage (and a portrait source should still fit if its
  // format hint was stale).

  const playerRatio = videoAspectRatio ?? (
    format === 'portrait' ? 9 / 16 : format === 'square' ? 1 : 16 / 9
  )
  const playerFrameStyle = {
    '--watch-player-ratio': playerRatio,
    aspectRatio: `${playerRatio}`,
  } as CSSProperties

  const isPortrait = videoAspectRatio !== null ? videoAspectRatio < 1 : format === 'portrait'

  // Error state — show a simple error message when video fails to load
  if (hasError) {
    return (
      <div className={`watch-player-stage w-full flex justify-center rounded-lg p-0.5 ${isPortrait ? 'watch-player-stage--portrait' : ''}`}>
        <div
          className={`watch-player-frame relative bg-zinc-900 overflow-hidden flex items-center justify-center ${isPortrait ? 'watch-player-frame--portrait' : 'watch-player-frame--wide'}`}
          style={playerFrameStyle}
        >
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="w-full h-full bg-zinc-800" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Play className="h-10 w-10 text-zinc-500" />
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">Video unavailable</p>
          </div>
        </div>
      </div>
    )
  }

  const progress = duration > 0
    ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
    : 0

  return (
    // Mobile fills the available width. On desktop, the stage and frame use
    // the same viewport budget, while the frame width is calculated from its
    // aspect ratio. That prevents an empty dark stage above/below the video.
    <div className={`watch-player-stage w-full flex justify-center lg:justify-start rounded-lg p-0.5 ${isPortrait ? 'watch-player-stage--portrait' : ''}`}>
    <div
      ref={containerRef}
      // tabIndex={0} makes the container focusable, enabling keyboard shortcuts.
      // The outline is hidden on focus to avoid visual clutter, but we keep
      // focus-visible:ring for accessibility when navigating with Tab.
      tabIndex={0}
      className={`watch-player-frame relative bg-black group rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 ${isPortrait ? 'watch-player-frame--portrait' : 'watch-player-frame--wide'}`}
      style={playerFrameStyle}
    >
      {/* Video clipping wrapper — overflow-hidden here clips the video
          corners to match the container's rounded-lg. We deliberately do
          NOT set overflow-hidden on the parent container so that the
          settings dropdown (positioned bottom-full) isn't clipped on
          small landscape players. */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <video
          ref={videoRef}
          poster={thumbnailUrl || undefined}
          // Ask the browser to fetch only media metadata before playback. This
          // is a hint (not a guarantee), and does not control hls.js loading;
          // it prevents eager full-file fetches for progressive uploads.
          // See ADR-6 for the remaining transcoding/HLS architecture gap.
          preload="metadata"
          playsInline
          className="w-full h-full object-contain"
          // crossOrigin='anonymous' is required so we can capture frames to a
          // <canvas> without tainting it (for the auto-thumbnail backfill).
          // Vercel Blob sends Access-Control-Allow-Origin: * so this is safe.
          crossOrigin="anonymous"
          // Chrome shows its own floating Picture-in-Picture affordance on
          // hover even without the native `controls` attribute — disable it
          // so it can't float on top of our custom control bar.
          disablePictureInPicture
          disableRemotePlayback
          onClick={handleContainerTap}
          onError={() => {
            setIsBuffering(false)
            setHasError(true)
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>

      {/* Controls overlay — visible on hover (desktop) or when
          controlsVisible is true (mobile tap-to-toggle). On desktop the
          group-hover:opacity-100 class handles the hover reveal. On mobile
          there is no hover, so we rely on the controlsVisible state, which
          is toggled by tapping the video and auto-hidden after 3s of
          inactivity while the video is playing. */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-200 ${
          controlsVisible
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
        }`}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          className="h-1 hover:h-1.5 bg-zinc-700 cursor-pointer transition-all mx-3 mb-1 relative overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          onClick={handleProgressClick}
          onKeyDown={handleProgressKeyDown}
        >
          {/* Buffer bar — lighter zinc bar behind the violet progress bar
              showing how much of the video has been downloaded. Helps users
              see whether seeking ahead will stall. */}
          {bufferedPercent > 0 && (
            <div
              className="absolute inset-y-0 left-0 bg-zinc-500 rounded-full pointer-events-none"
              style={{ width: `${bufferedPercent}%` }}
            />
          )}
          <div
            className="h-full bg-violet-600 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-violet-600 rounded-full opacity-0 group-hover:opacity-100" />
          </div>
        </div>

        <div className="flex items-center flex-nowrap gap-2 px-3 pb-2 pt-1">
          <button
            onClick={togglePlay}
            className="shrink-0 text-white hover:text-violet-400 transition-colors p-1.5 sm:p-1"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-5 w-5 sm:h-4 sm:w-4" /> : <Play className="h-5 w-5 sm:h-4 sm:w-4" />}
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleMute}
              className="text-white hover:text-violet-400 transition-colors p-1.5 sm:p-1"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-5 w-5 sm:h-4 sm:w-4" /> : <Volume2 className="h-5 w-5 sm:h-4 sm:w-4" />}
            </button>
            {/* Volume slider takes real width (64px) that a narrow portrait
                player can't spare alongside play/time/settings/fullscreen —
                drop it there and keep just the mute toggle. */}
            {format !== 'portrait' && !(videoAspectRatio && videoAspectRatio < 1) && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-zinc-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                aria-label="Volume"
              />
            )}
          </div>

          <span className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs text-zinc-300 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1 min-w-0" />

          {/* Settings */}
          <div className="relative shrink-0" data-video-settings>
            <button
              ref={settingsButtonRef}
              onClick={() => setShowSettings((visible) => !visible)}
              aria-expanded={showSettings}
              className="text-white hover:text-violet-400 transition-colors p-1.5 sm:p-1"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
            {showSettings && (
              <div
                role="group"
                aria-label="Video settings"
                className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg rounded-lg py-2 z-50"
              >
                {/* Quality section — only shown when HLS levels are available */}
                {qualityLevels.length > 0 ? (
                  <>
                    <p className="px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Quality {currentQuality === -1 && sourceLabel !== 'Auto' && `· ${sourceLabel}`}
                    </p>
                    {qualityLevels.map((q) => (
                      <button
                        key={`${q.label}-${q.level}`}
                        onClick={() => handleQualityChange(q.level)}
                        className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                          currentQuality === q.level ? 'text-violet-600 dark:text-violet-400 dark:bg-violet-900/30 bg-violet-50' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                    <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
                  </>
                ) : (
                  // Progressive download — single source, just show its label
                  <>
                    <p className="px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Quality</p>
                    <div className="px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300">{sourceLabel}</div>
                    <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
                  </>
                )}
                <p className="px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Speed</p>
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                      playbackSpeed === speed ? 'text-violet-600 dark:text-violet-400 dark:bg-violet-900/30 bg-violet-50' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {speed}x{speed === 1 ? ' (Normal)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            className="shrink-0 text-white hover:text-violet-400 transition-colors p-1.5 sm:p-1"
            aria-label="Fullscreen"
          >
            <Maximize className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* Play/pause button overlays — centered buttons that appear in
          two scenarios:
          1. Paused: a Play button so the user can start playback. Tapping
             it plays + reveals controls for follow-up actions.
          2. Playing + controls visible: a Pause button so mobile users
             can pause without having to find the small button in the
             bottom bar. Tapping it pauses; the controls auto-hide 3s
             after the last interaction.
          The play button is hidden while buffering (the spinner takes its
          place) so the user doesn't see a play button they can't use. */}
      {!isPlaying && !isBuffering && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-none"
        >
          <button
            type="button"
            aria-label="Play"
            className="w-14 h-14 rounded-full bg-zinc-900/50 flex items-center justify-center backdrop-blur-sm pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
              setControlsVisible(true)
            }}
          >
            <Play className="h-7 w-7 text-white ml-0.5" />
          </button>
        </div>
      )}
      {/* Buffering spinner — shown only while active playback is waiting for
          data (re-buffering after a stall or seeking ahead of what's
          downloaded). It replaces the pause affordance while playback waits;
          pointer-events-none lets taps pass through to the container. */}
      {isPlaying && isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="h-10 w-10 text-white/80 animate-spin" />
        </div>
      )}
      {isPlaying && !isBuffering && controlsVisible && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-none"
        >
          <button
            type="button"
            aria-label="Pause"
            className="w-14 h-14 rounded-full bg-zinc-900/50 flex items-center justify-center backdrop-blur-sm pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
          >
            <Pause className="h-7 w-7 text-white" />
          </button>
        </div>
      )}
    </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, Film, ImagePlus, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { put } from '@vercel/blob/client'

interface Category {
  id: string
  name: string
  slug: string
}

export function UploadPage() {
  const { user } = useAuth()
  const { navigate } = useNavigation()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [format, setFormat] = useState('portrait')
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null) // actual w/h ratio
  const [categories, setCategories] = useState<Category[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch('/api/v1/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories)
      }
    } catch { /* ignore */ }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoPreview(url)

    // Auto-detect orientation from the video file itself AND auto-generate
    // a thumbnail from the first frame — so users who don't manually pick
    // a thumbnail still get one in their VideoCard / watch page poster.
    // We create a temporary <video> element, load the file, read
    // videoWidth/videoHeight, seek to ~1 second in, and capture that frame
    // to a PNG via <canvas>.
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    video.onloadedmetadata = () => {
      const w = video.videoWidth
      const h = video.videoHeight
      if (w === 0 || h === 0) return // couldn't read — keep default 'portrait'

      // Store the actual aspect ratio so the container fits the video exactly
      setVideoAspectRatio(w / h)

      let detected: 'portrait' | 'landscape' | 'square'
      if (w > h) {
        detected = 'landscape'
      } else if (w < h) {
        detected = 'portrait'
      } else {
        detected = 'square'
      }
      setFormat(detected)

      // Seek to ~1 second in (or 10% of duration if very short) so we skip
      // any black lead-in. Some browsers require a play() before seek works
      // on muted videos — wrapped in a try/catch because play() can reject.
      const seekTo = Math.min(1, (video.duration || 10) * 0.1)
      try { void video.play().catch(() => {}) } catch { /* ignore */ }
      video.currentTime = seekTo
    }

    // Capture the frame once we've seeked. onseeked fires after currentTime
    // settles. If the browser doesn't fire onseeked, we fall back to
    // onloadeddata (first frame available).
    const captureFrame = () => {
      try {
        const w = video.videoWidth
        const h = video.videoHeight
        if (!w || !h) return

        const canvas = document.createElement('canvas')
        // Cap the thumbnail at 720px on the long side — keeps the upload
        // small while preserving enough detail for cards and posters.
        const maxDim = 720
        const scale = Math.min(1, maxDim / Math.max(w, h))
        canvas.width = Math.round(w * scale)
        canvas.height = Math.round(h * scale)

        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          if (!blob) return
          // Don't override a thumbnail the user already picked manually.
          setThumbnailFile((prev) => {
            if (prev) return prev
            const generated = new File([blob], 'thumbnail.png', { type: 'image/png' })
            setThumbnailPreview(URL.createObjectURL(generated))
            return generated
          })
        }, 'image/png', 0.9)
      } catch {
        // Canvas capture can throw if the video is tainted (CORS) — but
        // since this is a blob: URL we control, it shouldn't. Just bail.
      } finally {
        URL.revokeObjectURL(video.src)
        try { video.pause() } catch { /* ignore */ }
      }
    }

    video.onseeked = captureFrame
    // Fallback: some browsers don't reliably fire onseeked for blob URLs.
    // If we reach onloadeddata without a thumbnail yet, capture there too.
    video.onloadeddata = () => {
      // Only if onseeked didn't already fire
      if (video.currentTime > 0 && video.currentTime < 0.5) {
        // still at the start — try seeking forward
        video.currentTime = Math.min(1, (video.duration || 10) * 0.1)
      }
    }

    video.onerror = () => {
      // If metadata fails to load, keep the default 'portrait'
      URL.revokeObjectURL(video.src)
    }
    video.src = url
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      const url = URL.createObjectURL(file)
      setThumbnailPreview(url)
    }
  }

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : prev.length < 3
          ? [...prev, catId]
          : prev
    )
  }

  const commitTag = (raw: string) => {
    const normalized = raw.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!normalized) return
    if (tags.includes(normalized)) return
    if (tags.length >= 8) return
    setTags((prev) => [...prev, normalized])
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitTag(tagInput)
      setTagInput('')
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoFile || !title || !user?.channelId) return

    setUploading(true)
    setUploadProgress(0)
    try {
      // Step 1: Get a client upload token from our server
      const tokenRes = await fetch(
        `/api/v1/upload?contentType=${encodeURIComponent(videoFile.type)}&filename=${encodeURIComponent(videoFile.name)}`,
      )
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to get upload token')
      }
      const { token, pathname } = await tokenRes.json()

      // Step 2: Upload directly to Vercel Blob from the browser using put()
      // The file bytes go straight to Blob's storage, bypassing the
      // serverless 4.5 MB body limit.
      const blob = await put(pathname, videoFile, {
        access: 'public',
        contentType: videoFile.type,
        token,
        onUploadProgress: (progress) => {
          setUploadProgress(progress.percentage)
        },
      })

      // Step 3: Upload thumbnail if provided (same flow)
      let thumbnailUrl: string | null = null
      if (thumbnailFile) {
        const thumbTokenRes = await fetch(
          `/api/v1/upload?contentType=${encodeURIComponent(thumbnailFile.type)}&filename=${encodeURIComponent(thumbnailFile.name)}`,
        )
        if (thumbTokenRes.ok) {
          const { token: thumbToken, pathname: thumbPathname } = await thumbTokenRes.json()
          const thumbBlob = await put(thumbPathname, thumbnailFile, {
            access: 'public',
            contentType: thumbnailFile.type,
            token: thumbToken,
          })
          thumbnailUrl = thumbBlob.url
        }
      }

      // Step 4: Create the video record with the Blob URL
      const createRes = await fetch('/api/v1/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: user.channelId,
          title,
          description,
          videoUrl: blob.url,
          thumbnailUrl,
          aspectRatio: format === 'portrait' ? '9:16' : format === 'landscape' ? '16:9' : '1:1',
          format,
          status: 'ready',
          categoryIds: selectedCategories,
          tags,
        }),
      })

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create video')
      }

      toast({
        title: 'Video uploaded!',
        description: 'Your video is now live.',
      })

      navigate({ page: 'home' })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // Use the actual video aspect ratio if we have it; fall back to format-based guess
  const containerStyle = videoAspectRatio
    ? { aspectRatio: `${videoAspectRatio}` }
    : undefined
  const fallbackAspect = format === 'portrait' ? 'aspect-[9/16]' : format === 'landscape' ? 'aspect-video' : 'aspect-square'

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-vert-fade-in">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Upload Video</h1>

      <form onSubmit={handleSubmit}>
        {/* Two-column layout on desktop: preview on left, details on right */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8">

          {/* LEFT: Video + thumbnail preview */}
          <div className="space-y-4">
            {/* Video upload / preview */}
            <div>
              <Label className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm">
                Video *
                {videoFile && (
                  <span className="ml-2 text-xs text-zinc-400 font-normal">
                    {format} · auto-detected
                  </span>
                )}
              </Label>
              {videoPreview ? (
                <div
                  className="relative w-full max-w-[280px] bg-zinc-900 rounded-lg overflow-hidden"
                  style={containerStyle || undefined}
                >
                  <video
                    src={videoPreview}
                    className="w-full h-full object-contain"
                    muted
                  />
                  <button
                    type="button"
                    onClick={() => { setVideoFile(null); setVideoPreview(null); setVideoAspectRatio(null) }}
                    className="absolute top-2 right-2 bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 rounded-full p-1 hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center ${fallbackAspect} w-full max-w-[280px] bg-white dark:bg-zinc-900 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-500 cursor-pointer transition-colors`}>
                  <Film className="h-8 w-8 text-zinc-400 mb-2" />
                  <p className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">Select video</p>
                  <p className="text-zinc-400 text-xs mt-1">MP4, WebM, MOV · max 200MB</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <Label className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm">
                Thumbnail <span className="text-zinc-400 font-normal">(auto-generated — replace if you want)</span>
              </Label>
              {thumbnailPreview ? (
                <div className="relative inline-block">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail"
                    className="w-full max-w-[280px] aspect-[9/16] object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => { setThumbnailFile(null); setThumbnailPreview(null) }}
                    className="absolute top-2 right-2 bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 rounded-full p-1 hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-500 cursor-pointer transition-colors w-fit">
                  <ImagePlus className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-zinc-600 dark:text-zinc-300 text-sm">Add thumbnail</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* RIGHT: Details */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your video a title"
                className="bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-violet-600"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video"
                className="bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 min-h-[100px] resize-none focus-visible:ring-violet-600"
              />
            </div>

            {/* Categories */}
            <div>
              <Label className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm">
                Categories <span className="text-zinc-400 font-normal">(up to 3)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedCategories.includes(cat.id)
                        ? 'bg-violet-600 text-white'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm">
                Tags <span className="text-zinc-400 font-normal">(up to 8)</span>
              </Label>
              <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus-within:ring-2 focus-within:ring-violet-600 focus-within:border-violet-600 transition-colors">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-md text-xs font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-violet-400 hover:text-violet-700 transition-colors"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {tags.length < 8 && (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => {
                      if (tagInput.trim()) {
                        commitTag(tagInput)
                        setTagInput('')
                      }
                    }}
                    placeholder={tags.length === 0 ? "tutorial, diy, satisfying…" : "Add another…"}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
                  />
                )}
              </div>
              {tags.length === 8 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Tag limit reached</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!videoFile || !title || uploading}
              className="w-full sm:w-auto sm:min-w-[200px] bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform duration-100"
            >
              {uploading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {uploadProgress > 0 ? `Uploading… ${Math.round(uploadProgress)}%` : 'Uploading…'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

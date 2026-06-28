'use client'

import { useState, useEffect } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, Film, ImagePlus, X, Smartphone, Monitor, Square } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [format, setFormat] = useState('portrait')
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
    if (file) {
      setVideoFile(file)
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
    }
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
    try {
      const videoFormData = new FormData()
      videoFormData.append('video', videoFile)
      const uploadRes = await fetch('/api/v1/upload', {
        method: 'POST',
        body: videoFormData,
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }

      const uploadData = await uploadRes.json()

      let thumbnailUrl = null
      if (thumbnailFile) {
        const thumbFormData = new FormData()
        thumbFormData.append('video', thumbnailFile)
        const thumbRes = await fetch('/api/v1/upload', {
          method: 'POST',
          body: thumbFormData,
        })
        if (thumbRes.ok) {
          const thumbData = await thumbRes.json()
          thumbnailUrl = thumbData.url
        }
      }

      const createRes = await fetch('/api/v1/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: user.channelId,
          title,
          description,
          videoUrl: uploadData.url,
          thumbnailUrl,
          aspectRatio: format === 'portrait' ? '9:16' : format === 'landscape' ? '16:9' : '1:1',
          format,
          status: 'ready',
          categoryIds: selectedCategories,
          tags,
        }),
      })

      if (!createRes.ok) {
        throw new Error('Failed to create video')
      }

      toast({
        title: 'Video uploaded!',
        description: 'Your video has been uploaded successfully.',
      })

      navigate({ page: 'home' })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const formatAspect = format === 'portrait' ? 'aspect-[9/16]' : format === 'landscape' ? 'aspect-video' : 'aspect-square'
  const formatLabel = format === 'portrait' ? '9:16' : format === 'landscape' ? '16:9' : '1:1'

  const formatOptions = [
    { value: 'portrait', label: 'Portrait', ratio: '9:16', icon: Smartphone },
    { value: 'landscape', label: 'Landscape', ratio: '16:9', icon: Monitor },
    { value: 'square', label: 'Square', ratio: '1:1', icon: Square },
  ]

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 animate-vert-fade-in">
      <h1 className="text-xl font-bold text-zinc-900 mb-6">Upload Video</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Video upload area */}
        <div>
          <Label className="text-zinc-600 mb-2 block text-sm">Video File *</Label>
          {videoPreview ? (
            <div className={`relative ${formatAspect} max-w-xs mx-auto bg-zinc-200 rounded-lg overflow-hidden`}>
              <video
                src={videoPreview}
                className="w-full h-full object-contain"
                muted
              />
              <button
                type="button"
                onClick={() => { setVideoFile(null); setVideoPreview(null) }}
                className="absolute top-2 right-2 bg-white/80 text-zinc-600 rounded-full p-1 hover:bg-white transition-colors shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center ${formatAspect} max-w-xs mx-auto bg-white rounded-lg border-2 border-dashed border-zinc-300 hover:border-violet-400 cursor-pointer transition-colors`}>
              <Film className="h-10 w-10 text-zinc-600 mb-3" />
              <p className="text-zinc-700 text-sm font-medium">Select video file</p>
              <p className="text-zinc-700 text-xs mt-1">MP4, WebM, MOV (max 100MB)</p>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Thumbnail upload */}
        <div>
          <Label className="text-zinc-600 mb-2 block text-sm">Thumbnail</Label>
          <div className="flex items-center gap-4">
            {thumbnailPreview ? (
              <div className="relative">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail"
                  className="w-24 h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => { setThumbnailFile(null); setThumbnailPreview(null) }}
                  className="absolute -top-2 -right-2 bg-white/80 text-zinc-600 rounded-full p-0.5 shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-zinc-200 hover:border-violet-400 cursor-pointer transition-colors">
                <ImagePlus className="h-4 w-4 text-zinc-600" />
                <span className="text-zinc-600 text-sm">Add thumbnail</span>
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

        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-zinc-600 mb-2 block text-sm">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your video a catchy title"
            className="bg-zinc-100 border-zinc-300 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-violet-600"
            required
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-zinc-600 mb-2 block text-sm">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell viewers about your video"
            className="bg-zinc-100 border-zinc-300 text-zinc-800 placeholder:text-zinc-400 min-h-[100px] resize-none focus-visible:ring-violet-600"
          />
        </div>

        {/* Format selector */}
        <div>
          <Label className="text-zinc-600 mb-2 block text-sm">Video Format</Label>
          <div className="flex gap-3">
            {formatOptions.map((fmt) => (
              <button
                key={fmt.value}
                type="button"
                onClick={() => setFormat(fmt.value)}
                className={`flex-1 p-3 rounded-lg border text-center transition-colors active:scale-95 duration-100 ${
                  format === fmt.value
                    ? 'border-violet-600 bg-violet-50 text-zinc-900'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                }`}
              >
                <fmt.icon className="h-4 w-4 mx-auto mb-1.5" />
                <p className="text-xs font-medium">{fmt.label}</p>
                <p className="text-[10px] text-zinc-700 mt-0.5">{fmt.ratio}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Category selector */}
        <div>
          <Label className="text-zinc-600 mb-2 block text-sm">Categories (select up to 3)</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategories.includes(cat.id)
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tag input — freeform hashtags */}
        <div>
          <Label className="text-zinc-600 mb-2 block text-sm">
            Tags <span className="text-zinc-400 font-normal">(up to 8 — press Enter or comma to add)</span>
          </Label>
          <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-100 border border-zinc-300 rounded-lg focus-within:ring-2 focus-within:ring-violet-600 focus-within:border-violet-600 transition-colors">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 rounded-md text-xs font-medium"
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
                placeholder={tags.length === 0 ? "e.g. tutorial, diy, satisfying" : "Add another…"}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-zinc-800 placeholder:text-zinc-400"
              />
            )}
          </div>
          {tags.length === 8 && (
            <p className="text-xs text-zinc-500 mt-1">Tag limit reached (8 max)</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!videoFile || !title || uploading}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform duration-100"
        >
          {uploading ? (
            <>
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video ({formatLabel})
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

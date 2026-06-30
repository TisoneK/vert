import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getCurrentUser } from '@/lib/auth-helpers'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/v1/upload
 *
 * Accepts multipart/form-data with a single file field. The field name is
 * permissive — the UI currently uses "video" for both video files and
 * thumbnails, so we accept `video`, `thumbnail`, `file`, or the first field
 * we find.
 *
 * Files are stored in Vercel Blob (persistent object storage with a CDN).
 * The old local-filesystem implementation didn't survive on Vercel's
 * ephemeral serverless runtime — files were deleted immediately after
 * the request finished.
 *
 * Returns { url, filename, size, mimeType, originalName } with HTTP 201.
 */

const MAX_BYTES = 200 * 1024 * 1024 // 200 MB hard cap

const ALLOWED_MIME_PREFIXES = [
  'video/',
  'image/',
]

const EXT_BY_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

function safeExt(filename: string, mime: string): string {
  if (EXT_BY_MIME[mime]) return EXT_BY_MIME[mime]
  const parsed = filename.toLowerCase().match(/\.([a-z0-9]{2,5})$/)
  if (parsed) return parsed[1]!
  return 'bin'
}

export async function POST(req: NextRequest) {
  // Auth — any logged-in user can upload
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Rate limit by user — 10 uploads/min is plenty for power users, blocks spam.
  const rl = rateLimit(req, RATE_LIMITS.upload, `user:${user.id}`)
  if (!rl.ok) return rl.response!

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  // Find the first file field (permissive on name)
  const acceptedNames = ['video', 'thumbnail', 'file']
  let file: File | null = null
  for (const name of acceptedNames) {
    const candidate = form.get(name)
    if (candidate instanceof File && candidate.size > 0) {
      file = candidate
      break
    }
  }
  if (!file) {
    for (const value of form.values()) {
      if (value instanceof File && value.size > 0) {
        file = value
        break
      }
    }
  }
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Size guard
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_BYTES / (1024 * 1024)} MB)` },
      { status: 413 }
    )
  }

  // Type guard
  const mime = file.type || ''
  const isAllowed = ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))
  if (!isAllowed) {
    return NextResponse.json(
      { error: `Unsupported file type: ${mime || 'unknown'}` },
      { status: 415 }
    )
  }

  // Build a unique pathname for Vercel Blob.
  // Pattern: uploads/<yyyy-mm>/<userIdShort>-<uuid>.<ext>
  const now = new Date()
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const ext = safeExt(file.name, mime)
  const userIdShort = user.id.slice(-8)
  const randomId = crypto.randomUUID()
  const pathname = `uploads/${ym}/${userIdShort}-${randomId}.${ext}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: mime || undefined,
      // addRandomSuffix is false because we already generated a uuid above
      addRandomSuffix: false,
    })

    return NextResponse.json(
      {
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
        mimeType: mime,
        originalName: file.name || null,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Vercel Blob upload error:', err)
    return NextResponse.json(
      { error: 'Failed to upload file to storage' },
      { status: 500 }
    )
  }
}

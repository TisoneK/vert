import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
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
 * Files are stored on the local filesystem under `public/uploads/{yyyy-mm}/`
 * and served at `/uploads/{yyyy-mm}/<name>`. This is the dev fallback; in
 * production this route should be backed by S3/R2 (see VERT-RULES.md §6).
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
  // Prefer mime-derived extension so user-supplied names can't bypass type rules
  if (EXT_BY_MIME[mime]) return EXT_BY_MIME[mime]
  const parsed = path.extname(filename || '').toLowerCase().replace(/^\./, '')
  // Only allow alphanumerics, 2-5 chars
  if (parsed && /^[a-z0-9]{2,5}$/.test(parsed)) return parsed
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
    // Fall back to any File value in the form
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

  // Type guard — must be a known video/image MIME
  const mime = file.type || ''
  const isAllowed = ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))
  if (!isAllowed) {
    return NextResponse.json(
      { error: `Unsupported file type: ${mime || 'unknown'}` },
      { status: 415 }
    )
  }

  // Build storage path
  const now = new Date()
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const ext = safeExt(file.name, mime)
  // randomUUID for collision resistance + user-id prefix for trivial forensics
  const userIdShort = user.id.slice(-8)
  const filename = `${userIdShort}-${randomUUID()}.${ext}`
  const relDir = path.join('uploads', ym)
  const absDir = path.join(process.cwd(), 'public', relDir)
  const absPath = path.join(absDir, filename)
  const publicUrl = `/${relDir}/${filename}`

  try {
    await mkdir(absDir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(absPath, buffer)
  } catch (err) {
    console.error('Upload write error:', err)
    return NextResponse.json({ error: 'Failed to persist file' }, { status: 500 })
  }

  return NextResponse.json(
    {
      url: publicUrl,
      filename,
      size: file.size,
      mimeType: mime,
      originalName: file.name || null,
    },
    { status: 201 }
  )
}

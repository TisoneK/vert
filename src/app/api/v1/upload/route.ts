import { NextRequest, NextResponse } from 'next/server'
import { generateClientTokenFromReadWriteToken, handleUpload } from '@vercel/blob/client'
import { getCurrentUser } from '@/lib/auth-helpers'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Client-side upload flow for Vercel Blob.
 *
 * Two routes in one file:
 *   GET  /api/v1/upload  → generates a client token (server-side, uses BLOB_READ_WRITE_TOKEN)
 *   POST /api/v1/upload  → validates the upload after the client finished (server-side)
 *
 * The actual file bytes go directly from the browser to Vercel Blob,
 * bypassing the 4.5 MB serverless function body limit. The server only
 * generates a token and validates the result — it never touches the file.
 */

function generatePathname(userId: string, mime: string, originalName: string): string {
  const now = new Date()
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const userIdShort = userId.slice(-8)
  const randomId = crypto.randomUUID()

  // Derive extension from MIME or original filename
  const extByMime: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  let ext = extByMime[mime]
  if (!ext) {
    const match = originalName.toLowerCase().match(/\.([a-z0-9]{2,5})$/)
    ext = match?.[1] || 'bin'
  }

  return `uploads/${ym}/${userIdShort}-${randomId}.${ext}`
}

/**
 * GET /api/v1/upload?pathname=...&contentType=...
 * Returns a client token that the browser uses to upload directly to Vercel Blob.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const rl = rateLimit(req, RATE_LIMITS.upload, `user:${user.id}`)
  if (!rl.ok) return rl.response!

  const { searchParams } = new URL(req.url)
  const contentType = searchParams.get('contentType') || 'application/octet-stream'
  const requestedPathname = searchParams.get('pathname')

  // For security, the server generates the pathname — the client can't choose it.
  // We use the requested pathname only to derive the extension.
  const pathname = generatePathname(user.id, contentType, requestedPathname || '')

  try {
    const clientToken = await generateClientTokenFromReadWriteToken({
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      pathname,
      // Allow common video + image types
      allowedContentTypes: [
        'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
      ],
      // 200 MB max
      maximumSizeInBytes: 200 * 1024 * 1024,
    })

    return NextResponse.json({
      token: clientToken,
      pathname,
    })
  } catch (err) {
    console.error('Failed to generate Blob client token:', err)
    return NextResponse.json(
      { error: 'Failed to generate upload token' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/upload
 * Validates the upload after the client finished uploading to Vercel Blob.
 * Body: { token: string }
 * Returns: { url, pathname, size, mimeType }
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const rl = rateLimit(req, RATE_LIMITS.upload, `user:${user.id}`)
  if (!rl.ok) return rl.response!

  let body: { token?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Expected JSON body with token' }, { status: 400 })
  }

  if (!body.token) {
    return NextResponse.json({ error: 'Missing upload token' }, { status: 400 })
  }

  try {
    const blob = await handleUpload(body.token, {
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    })

    return NextResponse.json(
      {
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        mimeType: blob.contentType,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Blob handleUpload error:', err)
    return NextResponse.json(
      { error: 'Upload validation failed' },
      { status: 500 }
    )
  }
}

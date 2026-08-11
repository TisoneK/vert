import { NextRequest, NextResponse } from 'next/server'
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client'
import { getCurrentUser } from '@/lib/auth-helpers'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * GET /api/v1/upload?contentType=...&filename=...
 *
 * Generates a client token that the browser uses to upload directly to
 * Vercel Blob via put(). The file bytes go browser → Blob, bypassing
 * the serverless 4.5 MB body limit.
 */

const ALLOWED_CONTENT_TYPES = [
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
]

const MAX_SIZE = 200 * 1024 * 1024 // 200 MB

function generatePathname(userId: string, contentType: string, filename: string): string {
  const now = new Date()
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const userIdShort = userId.slice(-8)
  const randomId = crypto.randomUUID()

  const extByMime: Record<string, string> = {
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
  const ext = extByMime[contentType] || (filename.toLowerCase().match(/\.([a-z0-9]{2,5})$/)?.[1] || 'bin')

  return `uploads/${ym}/${userIdShort}-${randomId}.${ext}`
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const rl = rateLimit(req, RATE_LIMITS.upload, `user:${user.id}`)
  if (!rl.ok) return rl.response!

  // Check if a Blob token is configured.
  // We read from VERT_BLOB_TOKEN first (manually set, lets us use a public
  // store without fighting Vercel's locked env vars), then fall back to the
  // standard BLOB_READ_WRITE_TOKEN (auto-set when a store is connected).
  const blobToken = process.env.VERT_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    console.error('No Blob token found. Set VERT_BLOB_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN.')
    return NextResponse.json(
      {
        error: 'Upload storage is not configured. Set VERT_BLOB_READ_WRITE_TOKEN environment variable.',
        code: 'BLOB_TOKEN_MISSING',
      },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(req.url)
  const contentType = searchParams.get('contentType') || ''
  const filename = searchParams.get('filename') || ''

  if (!contentType) {
    return NextResponse.json({ error: 'contentType is required' }, { status: 400 })
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${contentType}. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}` },
      { status: 415 }
    )
  }

  const pathname = generatePathname(user.id, contentType, filename)

  try {
    const clientToken = await generateClientTokenFromReadWriteToken({
      token: blobToken,
      pathname,
      allowedContentTypes: ALLOWED_CONTENT_TYPES,
      maximumSizeInBytes: MAX_SIZE,
    })

    return NextResponse.json({
      token: clientToken,
      pathname,
    })
  } catch (err) {
    // Log the actual error server-side for debugging, but don't leak the raw
    // internal message to the client (review 2026-08-11 [L12]).
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('Failed to generate Blob client token:', errorMsg)

    return NextResponse.json(
      {
        error: 'Failed to generate upload token',
        code: 'BLOB_TOKEN_GENERATION_FAILED',
      },
      { status: 500 }
    )
  }
}

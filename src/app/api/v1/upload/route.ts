import { NextRequest, NextResponse } from 'next/server'
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client'
import { getCurrentUser } from '@/lib/auth-helpers'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * GET /api/v1/upload?contentType=...&filename=...
 *
 * Generates a client token that the browser uses to upload directly to
 * Vercel Blob. The actual file bytes go browser → Blob, bypassing the
 * serverless 4.5 MB body limit.
 *
 * The client then calls put() from @vercel/blob/client with this token.
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
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
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

  const { searchParams } = new URL(req.url)
  const contentType = searchParams.get('contentType') || ''
  const filename = searchParams.get('filename') || ''

  if (!contentType) {
    return NextResponse.json({ error: 'contentType is required' }, { status: 400 })
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return NextResponse.json({ error: `Unsupported file type: ${contentType}` }, { status: 415 })
  }

  const pathname = generatePathname(user.id, contentType, filename)

  try {
    const clientToken = await generateClientTokenFromReadWriteToken({
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      pathname,
      allowedContentTypes: ALLOWED_CONTENT_TYPES,
      maximumSizeInBytes: MAX_SIZE,
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

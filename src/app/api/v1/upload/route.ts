import { NextRequest, NextResponse } from 'next/server'
import { generateClientTokenFromReadWriteToken, handleUpload } from '@vercel/blob/client'
import { getCurrentUser } from '@/lib/auth-helpers'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Upload route for Vercel Blob client-side uploads.
 *
 * This route handles two things:
 * 1. GET /api/v1/upload — generates a client token (called by the browser
 *    before uploading)
 * 2. POST /api/v1/upload — the handleUpload endpoint (called by the
 *    @vercel/blob client's upload() function to get the token and to
 *    notify on completion)
 *
 * The actual file bytes go directly from browser → Vercel Blob, bypassing
 * the serverless 4.5 MB body limit.
 */

function generatePathname(userId: string, contentType: string): string {
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
  const ext = extByMime[contentType] || 'bin'

  return `uploads/${ym}/${userIdShort}-${randomId}.${ext}`
}

/**
 * GET /api/v1/upload?contentType=...
 * Returns a client token + pathname for the browser to use with upload().
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
  const pathname = generatePathname(user.id, contentType)

  try {
    const clientToken = await generateClientTokenFromReadWriteToken({
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      pathname,
      allowedContentTypes: [
        'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
      ],
      maximumSizeInBytes: 200 * 1024 * 1024,
    })

    return NextResponse.json({
      type: 'blob.generate-client-token',
      clientToken,
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
 * This is called by the @vercel/blob client's upload() function.
 * The body contains the type of request (generate-token or upload-completed).
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const rl = rateLimit(req, RATE_LIMITS.upload, `user:${user.id}`)
  if (!rl.ok) return rl.response!

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Expected JSON body' }, { status: 400 })
  }

  try {
    const result = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, _clientPayload, _multipart) => {
        // Return the constraints for the client token
        return {
          allowedContentTypes: [
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
            'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
          ],
          maximumSizeInBytes: 200 * 1024 * 1024,
        }
      },
      onUploadCompleted: async () => {
        // Could record the upload in the database here
      },
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('Blob handleUpload error:', err)
    return NextResponse.json(
      { error: 'Upload handling failed' },
      { status: 500 }
    )
  }
}

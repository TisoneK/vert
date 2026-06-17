import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const video = await db.video.findUnique({ where: { id } })
    if (!video || video.isRemoved) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    try {
      await db.savedVideo.create({
        data: {
          userId: user.id,
          videoId: id,
        },
      })
    } catch {
      // Already saved
    }

    return NextResponse.json({ message: 'Video saved' })
  } catch (error) {
    console.error('Save video error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await db.savedVideo.deleteMany({
      where: { userId: user.id, videoId: id },
    })

    return NextResponse.json({ message: 'Video unsaved' })
  } catch (error) {
    console.error('Unsave video error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

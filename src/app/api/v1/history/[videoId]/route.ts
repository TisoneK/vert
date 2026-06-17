import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await db.watchHistory.deleteMany({
      where: { userId: user.id, videoId },
    })

    return NextResponse.json({ message: 'History entry removed' })
  } catch (error) {
    console.error('History entry delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

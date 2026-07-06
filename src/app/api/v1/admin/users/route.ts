import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'
import { parsePagination } from '@/lib/pagination'

/**
 * GET /api/v1/admin/users
 *
 * Lists all users with pagination + optional search. Used by the Users
 * tab in the admin dashboard.
 *
 * Query params:
 *   ?q=<substring>     — filter by email OR username (case-insensitive)
 *   ?role=member|admin — filter by role
 *   ?page=1&limit=20   — pagination (clamped by parsePagination)
 *
 * Returns each user's id, email, username, role, isActive, createdAt,
 * and a channelId/channelName if they have one. Does NOT return
 * passwordHash — that field is excluded from the select.
 *
 * Admin-only.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim().toLowerCase()
    const roleFilter = searchParams.get('role')
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 20 })

    const where: Record<string, unknown> = {}
    if (q) {
      where.OR = [
        { email: { contains: q } },
        { username: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (roleFilter && ['member', 'admin'].includes(roleFilter)) {
      where.role = roleFilter
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          emailVerified: true,
          oauthProvider: true,
          avatarUrl: true,
          createdAt: true,
          channel: {
            select: { id: true, channelName: true, isSuspended: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    // Fetch video + comment counts separately — Prisma 6's _count with
    // a where filter requires the filtered-relation syntax, and doing it
    // in a follow-up query is clearer than fighting the type system.
    const userIds = users.map((u) => u.id)
    const [videoCounts, commentCounts] = await Promise.all([
      db.video.groupBy({
        by: ['channelId'],
        where: { isRemoved: false, channel: { userId: { in: userIds } } },
        _count: { _all: true },
      }),
      db.comment.groupBy({
        by: ['userId'],
        where: { isRemoved: false, userId: { in: userIds } },
        _count: { _all: true },
      }),
    ])
    // Build a map of userId → videoCount by joining through channel.userId.
    // videoCounts is keyed by channelId, so we need to look up which user
    // owns each channel.
    const channelToUser = new Map(
      users
        .filter((u) => u.channel)
        .map((u) => [u.channel!.id, u.id])
    )
    const videoCountMap = new Map<string, number>()
    for (const vc of videoCounts) {
      const userId = channelToUser.get(vc.channelId)
      if (userId) videoCountMap.set(userId, vc._count._all)
    }
    const commentCountMap = new Map<string, number>(
      commentCounts.map((c) => [c.userId, c._count._all])
    )

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      emailVerified: u.emailVerified,
      oauthProvider: u.oauthProvider,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
      channel: u.channel
        ? {
            id: u.channel.id,
            channelName: u.channel.channelName,
            isSuspended: u.channel.isSuspended,
          }
        : null,
      videoCount: videoCountMap.get(u.id) ?? 0,
      commentCount: commentCountMap.get(u.id) ?? 0,
    }))

    return NextResponse.json({
      users: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

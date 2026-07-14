import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { timingSafeEqual } from 'crypto'

/**
 * GET /api/seed?key=<SECRET>
 *
 * One-time seed endpoint for production. Visit this URL in the browser
 * to populate the database with demo content.
 *
 * Protected by a query param key so random visitors can't trigger it.
 * Set SEED_KEY in your Vercel env vars, then visit:
 *   https://vert-wine.vercel.app/api/seed?key=YOUR_SEED_KEY
 *
 * Idempotent: if data already exists, it skips. Does NOT delete existing
 * users or videos — only adds demo data if the DB is empty.
 */

function keyMatches(candidate: string | null, expected: string | undefined): boolean {
  if (!candidate || !expected) return false
  if (candidate.length !== expected.length) return false
  // timingSafeEqual needs equal-length Buffers; the length check above
  // means we're safe, but still wrap in try/catch in case of weird input.
  try {
    return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (!keyMatches(key, process.env.SEED_KEY)) {
    return NextResponse.json({ error: 'Unauthorized. Add ?key=YOUR_SEED_KEY' }, { status: 401 })
  }

  // Shared lazy singleton from src/lib/db.ts — carries the serverless pool
  // params and must not be $disconnect()ed here.
  const prisma = db

  try {
    // Check if already seeded
    const existingCategories = await prisma.category.count()
    if (existingCategories > 0) {
      return NextResponse.json({
        message: 'Database already has data. Skipping seed.',
        stats: {
          categories: await prisma.category.count(),
          videos: await prisma.video.count(),
          users: await prisma.user.count(),
          tags: await prisma.tag.count(),
        },
      })
    }

    const results: string[] = []

    // 1. Create admin user
    const adminPassword = await hash('admin123', 12)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@vert.com',
        username: 'vertadmin',
        passwordHash: adminPassword,
        role: 'admin',
        isActive: true,
        emailVerified: true,
        channel: { create: { channelName: 'Vert Admin' } },
      },
      include: { channel: true },
    })
    results.push(`Admin: ${admin.email}`)

    // 2. Create member users
    const memberPassword = await hash('password123', 12)
    const memberData = [
      { email: 'user1@vert.com', username: 'creativequeen', channelName: 'Creative Queen' },
      { email: 'user2@vert.com', username: 'dancevibes', channelName: 'Dance Vibes' },
      { email: 'user3@vert.com', username: 'foodieshots', channelName: 'Foodie Shots' },
      { email: 'user4@vert.com', username: 'travelvert', channelName: 'Travel Vert' },
      { email: 'user5@vert.com', username: 'techcraft', channelName: 'Tech Craft' },
    ]

    const users: Array<{ id: string; email: string; username: string }> = []
    const channels: Array<{ id: string; channelName: string; userId: string }> = []
    for (const data of memberData) {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          passwordHash: memberPassword,
          role: 'member',
          isActive: true,
          emailVerified: true,
          channel: {
            create: {
              channelName: data.channelName,
              subscriberCount: Math.floor(Math.random() * 5000) + 100,
            },
          },
        },
        include: { channel: true },
      })
      users.push(user)
      if (user.channel) channels.push(user.channel)
      results.push(`User: ${user.email}`)
    }

    // 3. Create categories
    const categoryData = [
      { name: 'Music', slug: 'music', description: 'Music videos, covers, and performances' },
      { name: 'Sports', slug: 'sports', description: 'Sports highlights and athleticism' },
      { name: 'Gaming', slug: 'gaming', description: 'Gameplay, reviews, and gaming culture' },
      { name: 'Entertainment', slug: 'entertainment', description: 'Fun and entertaining content' },
      { name: 'News', slug: 'news', description: 'News and current events' },
      { name: 'Education', slug: 'education', description: 'Learn something new' },
      { name: 'Comedy', slug: 'comedy', description: 'Funny videos and sketches' },
      { name: 'Tech', slug: 'tech', description: 'Technology reviews and tutorials' },
      { name: 'Travel', slug: 'travel', description: 'Travel vlogs and destinations' },
      { name: 'Food', slug: 'food', description: 'Food, cooking, and recipes' },
      { name: 'Fitness', slug: 'fitness', description: 'Workouts and fitness tips' },
      { name: 'Art', slug: 'art', description: 'Art, creativity, and DIY' },
      { name: 'Other', slug: 'other', description: 'Everything else' },
    ]

    const categories: Array<{ id: string; name: string; slug: string }> = []
    for (const cat of categoryData) {
      const category = await prisma.category.create({ data: cat })
      categories.push(category)
    }
    results.push(`${categories.length} categories`)

    // 4. Create demo videos
    const sampleVideos = [
      { title: 'Morning Routine Hacks', desc: 'Start your day right', cats: ['lifestyle', 'education'], format: 'portrait' },
      { title: 'Sunset Watercolor Tutorial', desc: 'Learn to paint a sunset', cats: ['art', 'education'], format: 'portrait' },
      { title: 'DIY Room Decor Ideas', desc: 'Transform your space', cats: ['art'], format: 'portrait' },
      { title: '5-Minute Smoothie Bowl', desc: 'Quick and healthy breakfast', cats: ['food'], format: 'portrait' },
      { title: 'Dance Choreography Breakdown', desc: 'Step by step', cats: ['music', 'entertainment'], format: 'portrait' },
      { title: 'Street Food Adventure', desc: 'Best street food in town', cats: ['food', 'travel'], format: 'landscape' },
      { title: 'Mountain Hike Views', desc: 'Breathtaking mountain scenery', cats: ['travel'], format: 'landscape' },
      { title: 'Coding Tips for Beginners', desc: 'Essential coding advice', cats: ['tech', 'education'], format: 'portrait' },
      { title: 'Raspberry Pi Projects', desc: '5 amazing Raspberry Pi projects', cats: ['tech'], format: 'portrait' },
      { title: 'Soldering Tutorial for Beginners', desc: 'Learn to solder', cats: ['tech', 'education'], format: 'square' },
      { title: '3D Printing Tips & Tricks', desc: 'Improve your 3D prints', cats: ['tech'], format: 'portrait' },
      { title: 'Sketching Faces Quick Tips', desc: 'Portrait drawing techniques', cats: ['art'], format: 'portrait' },
      { title: 'Gaming Highlights Reel', desc: 'Best moments of the week', cats: ['gaming'], format: 'landscape' },
      { title: 'Workout Without Equipment', desc: 'Home workout routine', cats: ['fitness'], format: 'portrait' },
      { title: 'Comedy Skit: Bad Wifi', desc: 'When the wifi goes out', cats: ['comedy', 'entertainment'], format: 'portrait' },
      { title: 'Piano Cover: Popular Hits', desc: 'Acoustic piano covers', cats: ['music'], format: 'landscape' },
      { title: 'European Train Journey', desc: 'Scenic train ride', cats: ['travel'], format: 'landscape' },
      { title: 'Desk Setup Tour 2025', desc: 'My productivity setup', cats: ['tech'], format: 'portrait' },
      { title: 'Choreography Breakdown', desc: 'Dance tutorial', cats: ['music', 'entertainment'], format: 'portrait' },
      { title: 'Quick Recipe: Pasta Night', desc: '15-minute pasta', cats: ['food'], format: 'portrait' },
      { title: 'Photography Tips for Phone', desc: 'Better phone photos', cats: ['art', 'education'], format: 'portrait' },
    ]

    const allVideos: Array<{ id: string; title: string; channelId: string }> = []
    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i]!
      const startIndex = i * 4
      for (let j = startIndex; j < Math.min(startIndex + 4, sampleVideos.length); j++) {
        const v = sampleVideos[j]!
        const video = await prisma.video.create({
          data: {
            channelId: channel.id,
            title: v.title,
            description: v.desc,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            thumbnailUrl: null,
            durationSeconds: Math.floor(Math.random() * 120) + 30,
            aspectRatio: v.format === 'portrait' ? '9:16' : v.format === 'landscape' ? '16:9' : '1:1',
            format: v.format,
            status: 'ready',
            viewCount: Math.floor(Math.random() * 50000),
            likeCount: Math.floor(Math.random() * 2000),
            categories: {
              create: v.cats
                .map((slug) => categories.find((c) => c.slug === slug))
                .filter(Boolean)
                .map((cat) => ({ categoryId: cat!.id })),
            },
          },
        })
        allVideos.push(video)
      }
    }
    results.push(`${allVideos.length} videos`)

    // 5. Create comments
    const commentTexts = [
      'This is amazing!',
      'Great content, keep it up!',
      'This is so satisfying to watch',
      'I learned so much from this',
      'Who else is watching this at 3am?',
      'This deserves more views',
      'Absolutely love this!',
      'Can you make a part 2?',
    ]

    for (const video of allVideos.slice(0, 10)) {
      const numComments = Math.floor(Math.random() * 3) + 1
      for (let k = 0; k < numComments; k++) {
        const commenter = users[Math.floor(Math.random() * users.length)]!
        await prisma.comment.create({
          data: {
            videoId: video.id,
            userId: commenter.id,
            content: commentTexts[Math.floor(Math.random() * commentTexts.length)]!,
          },
        })
      }
    }
    results.push('Comments')

    // 6. Create votes
    for (const video of allVideos.slice(0, 10)) {
      for (const user of users) {
        if (Math.random() > 0.15) {
          await prisma.vote.create({
            data: {
              userId: user.id,
              videoId: video.id,
              voteType: Math.random() > 0.15 ? 'like' : 'dislike',
            },
          }).catch(() => {})
        }
      }
    }
    results.push('Votes')

    // 7. Create subscriptions
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < users.length; j++) {
        if (i !== j && Math.random() > 0.5) {
          await prisma.subscription.create({
            data: {
              subscriberId: users[i]!.id,
              channelId: channels[j]!.id,
            },
          }).catch(() => {})
        }
      }
    }
    results.push('Subscriptions')

    // 8. Create tags
    const tagPool = [
      'tutorial', 'beginner', 'diy', 'creative', 'satisfying',
      'asmr', 'food', 'recipe', 'travel', 'adventure',
      'tech', 'review', 'shorts', 'viral', 'aesthetic',
      'morning', 'routine', 'budget', 'hack', 'easy',
    ]

    const tagRecords = await Promise.all(
      tagPool.map((name) =>
        prisma.tag.create({ data: { name: name.toLowerCase(), label: `#${name}` } })
      )
    )

    // Attach 2-4 tags to each video
    for (const video of allVideos) {
      const titleLower = video.title.toLowerCase()
      const matched = new Set<string>()
      for (const tag of tagPool) {
        if (titleLower.includes(tag)) matched.add(tag)
      }
      while (matched.size < 2) {
        matched.add(tagPool[Math.floor(Math.random() * tagPool.length)]!)
      }
      while (matched.size > 4) {
        const arr = Array.from(matched)
        matched.delete(arr[Math.floor(Math.random() * arr.length)]!)
      }
      const tagIds = Array.from(matched).map(
        (name) => tagRecords.find((t) => t.name === name)!.id
      )
      await prisma.videoTag.createMany({
        data: tagIds.map((tagId) => ({ videoId: video.id, tagId })),
      })
    }

    // Update usage counts
    for (const tag of tagRecords) {
      const count = await prisma.videoTag.count({ where: { tagId: tag.id } })
      await prisma.tag.update({ where: { id: tag.id }, data: { usageCount: count } })
    }
    results.push(`${tagRecords.length} tags`)

    return NextResponse.json({
      message: 'Seed completed successfully!',
      results,
      stats: {
        users: await prisma.user.count(),
        channels: await prisma.channel.count(),
        categories: await prisma.category.count(),
        videos: await prisma.video.count(),
        tags: await prisma.tag.count(),
        comments: await prisma.comment.count(),
        votes: await prisma.vote.count(),
        subscriptions: await prisma.subscription.count(),
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Seed failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

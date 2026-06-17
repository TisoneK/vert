import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.savedVideo.deleteMany()
  await prisma.watchHistory.deleteMany()
  await prisma.playlistItem.deleteMany()
  await prisma.playlist.deleteMany()
  await prisma.videoCategory.deleteMany()
  await prisma.category.deleteMany()
  await prisma.adminAction.deleteMany()
  await prisma.flag.deleteMany()
  await prisma.vote.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.video.deleteMany()
  await prisma.channel.deleteMany()
  await prisma.user.deleteMany()

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@vert.com',
      username: 'vertadmin',
      passwordHash: adminPassword,
      role: 'admin',
      avatarUrl: null,
      isActive: true,
      emailVerified: true,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create member users
  const memberPassword = await hash('password123', 12)
  const memberData = [
    { email: 'user1@vert.com', username: 'creativequeen', channelName: 'Creative Queen' },
    { email: 'user2@vert.com', username: 'dancevibes', channelName: 'Dance Vibes' },
    { email: 'user3@vert.com', username: 'foodieshots', channelName: 'Foodie Shots' },
    { email: 'user4@vert.com', username: 'travelvert', channelName: 'Travel Vert' },
    { email: 'user5@vert.com', username: 'techcraft', channelName: 'Tech Craft' },
  ]

  const users = []
  const channels = []

  for (const data of memberData) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: memberPassword,
        role: 'member',
        avatarUrl: null,
        isActive: true,
        emailVerified: true,
        channel: {
          create: {
            channelName: data.channelName,
            description: `Welcome to ${data.channelName}! Creating amazing vertical content just for you.`,
            subscriberCount: Math.floor(Math.random() * 5000) + 100,
            videoCount: 0,
          },
        },
      },
      include: { channel: true },
    })
    users.push(user)
    if (user.channel) {
      channels.push(user.channel)
    }
    console.log(`✅ User created: ${user.email} with channel: ${user.channel?.channelName}`)
  }

  // Create categories
  const categoryData = [
    { name: 'Music', slug: 'music', description: 'Music videos, covers, and performances' },
    { name: 'Sports', slug: 'sports', description: 'Sports highlights and athleticism' },
    { name: 'Gaming', slug: 'gaming', description: 'Gaming content and streams' },
    { name: 'Entertainment', slug: 'entertainment', description: 'Fun and entertaining content' },
    { name: 'News', slug: 'news', description: 'News and current events' },
    { name: 'Education', slug: 'education', description: 'Learn something new' },
    { name: 'Comedy', slug: 'comedy', description: 'Funny videos and sketches' },
    { name: 'Tech', slug: 'tech', description: 'Technology, gadgets, and builds' },
    { name: 'Travel', slug: 'travel', description: 'Travel vlogs and adventures' },
    { name: 'Food', slug: 'food', description: 'Food, cooking, and recipes' },
    { name: 'Fitness', slug: 'fitness', description: 'Workouts and fitness tips' },
    { name: 'Art', slug: 'art', description: 'Art, creativity, and DIY' },
    { name: 'Other', slug: 'other', description: 'Everything else' },
  ]

  const categories = []
  for (const cat of categoryData) {
    const category = await prisma.category.create({ data: cat })
    categories.push(category)
  }
  console.log(`✅ Created ${categories.length} categories`)

  // Helper to find category by slug
  const getCategory = (slug: string) => categories.find(c => c.slug === slug)!

  // Create demo videos for each channel
  const videoTitles = [
    // Channel 0 - Creative Queen (Art)
    [
      { title: 'Sunset Watercolor Tutorial', desc: 'Learn to paint stunning sunsets with watercolors in 60 seconds', duration: 58, cats: ['art'], format: 'portrait' as const },
      { title: 'DIY Room Decor Ideas', desc: 'Transform your space with these simple DIY projects', duration: 45, cats: ['art', 'entertainment'], format: 'portrait' as const },
      { title: 'Sketching Faces Quick Tips', desc: 'Master portrait sketching with these pro tips', duration: 62, cats: ['art', 'education'], format: 'landscape' as const },
      { title: 'Canvas Art Time-lapse', desc: 'Watch this amazing abstract piece come to life', duration: 30, cats: ['art'], format: 'square' as const },
    ],
    // Channel 1 - Dance Vibes (Entertainment)
    [
      { title: 'TikTok Dance Challenge 2025', desc: 'Can you keep up with the latest dance trend?', duration: 35, cats: ['entertainment', 'music'], format: 'portrait' as const },
      { title: 'Choreography Breakdown', desc: 'Step-by-step breakdown of this viral choreo', duration: 90, cats: ['entertainment'], format: 'portrait' as const },
      { title: 'Dance Battle Highlights', desc: 'The most epic dance battle moments this week', duration: 55, cats: ['entertainment', 'sports'], format: 'landscape' as const },
    ],
    // Channel 2 - Foodie Shots (Food)
    [
      { title: 'Perfect Latte Art', desc: 'How to create beautiful latte art at home', duration: 42, cats: ['food'], format: 'portrait' as const },
      { title: 'Street Food Tour Bangkok', desc: 'Exploring the best street food in Bangkok', duration: 78, cats: ['food', 'travel'], format: 'portrait' as const },
      { title: '5-Minute Smoothie Bowl', desc: 'Quick and delicious smoothie bowl recipe', duration: 38, cats: ['food', 'fitness'], format: 'portrait' as const },
      { title: 'Chocolate Lava Cake Recipe', desc: 'Decadent chocolate lava cake in under 10 minutes', duration: 65, cats: ['food'], format: 'portrait' as const },
      { title: 'Sushi Rolling for Beginners', desc: 'Master the basics of sushi rolling', duration: 72, cats: ['food', 'education'], format: 'portrait' as const },
    ],
    // Channel 3 - Travel Vert (Travel)
    [
      { title: 'Hidden Gems in Tokyo', desc: 'Discover secret spots most tourists miss', duration: 88, cats: ['travel'], format: 'portrait' as const },
      { title: 'Bali Sunrise Trek', desc: 'An unforgettable sunrise experience atop Mount Batur', duration: 50, cats: ['travel', 'fitness'], format: 'portrait' as const },
      { title: 'European Train Journey', desc: 'The most scenic train routes across Europe', duration: 95, cats: ['travel'], format: 'landscape' as const },
    ],
    // Channel 4 - Tech Craft (Tech)
    [
      { title: 'Custom Keyboard Build', desc: 'Building the perfect mechanical keyboard from scratch', duration: 120, cats: ['tech'], format: 'portrait' as const },
      { title: 'Desk Setup Tour 2025', desc: 'Check out my ultimate productivity setup', duration: 45, cats: ['tech'], format: 'portrait' as const },
      { title: '3D Printing Tips & Tricks', desc: 'Level up your 3D printing game with these tips', duration: 68, cats: ['tech', 'education'], format: 'portrait' as const },
      { title: 'Smart Home on a Budget', desc: 'Transform your home without breaking the bank', duration: 55, cats: ['tech'], format: 'portrait' as const },
      { title: 'Soldering Tutorial for Beginners', desc: 'Learn basic soldering techniques', duration: 82, cats: ['tech', 'education'], format: 'square' as const },
      { title: 'Raspberry Pi Projects', desc: '5 amazing Raspberry Pi projects you can build today', duration: 75, cats: ['tech', 'gaming'], format: 'portrait' as const },
    ],
  ]

  const allVideos = []

  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i]
    const titles = videoTitles[i]

    for (let j = 0; j < titles.length; j++) {
      const videoData = titles[j]
      const aspectRatio = videoData.format === 'portrait' ? '9:16' : videoData.format === 'landscape' ? '16:9' : '1:1'
      const video = await prisma.video.create({
        data: {
          channelId: channel.id,
          title: videoData.title,
          description: videoData.desc,
          videoUrl: `/uploads/sample-${i + 1}-${j + 1}.mp4`,
          thumbnailUrl: null,
          durationSeconds: videoData.duration,
          aspectRatio,
          format: videoData.format,
          status: 'ready',
          viewCount: Math.floor(Math.random() * 50000) + 100,
          likeCount: Math.floor(Math.random() * 2000) + 10,
          dislikeCount: Math.floor(Math.random() * 50),
        },
      })

      // Assign categories
      for (const catSlug of videoData.cats) {
        const cat = getCategory(catSlug)
        await prisma.videoCategory.create({
          data: {
            videoId: video.id,
            categoryId: cat.id,
          },
        })
      }

      allVideos.push(video)
    }

    // Update channel video count
    await prisma.channel.update({
      where: { id: channel.id },
      data: { videoCount: titles.length },
    })
  }
  console.log(`✅ Created ${allVideos.length} demo videos with categories and formats`)

  // Create comments
  const commentTexts = [
    'This is amazing! 🔥',
    'Love this content, keep it up!',
    'How do you do this? Tutorial please!',
    'Best vert video I\'ve seen today',
    'Can you make more of these?',
    'This is so satisfying to watch',
    'Wow, I need to try this!',
    'Incredible skills 💪',
    'First! Amazing content as always',
    'This made my day 😊',
    'I watch this on repeat',
    'The quality is insane!',
    'Subscribed immediately!',
    'Who else is watching this at 3am?',
    'This deserves way more views',
  ]

  for (let i = 0; i < 40; i++) {
    const video = allVideos[Math.floor(Math.random() * allVideos.length)]
    const user = users[Math.floor(Math.random() * users.length)]
    await prisma.comment.create({
      data: {
        videoId: video.id,
        userId: user.id,
        content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
      },
    })
  }
  console.log('✅ Created comments')

  // Create votes
  for (let i = 0; i < 60; i++) {
    const video = allVideos[Math.floor(Math.random() * allVideos.length)]
    const user = users[Math.floor(Math.random() * users.length)]
    const voteType = Math.random() > 0.15 ? 'like' : 'dislike'

    try {
      await prisma.vote.create({
        data: {
          userId: user.id,
          videoId: video.id,
          voteType,
        },
      })
    } catch {
      // Skip duplicate votes
    }
  }
  console.log('✅ Created votes')

  // Create subscriptions
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j && Math.random() > 0.5) {
        try {
          await prisma.subscription.create({
            data: {
              subscriberId: users[i].id,
              channelId: channels[j].id,
              emailNotifications: Math.random() > 0.7,
            },
          })
        } catch {
          // Skip duplicates
        }
      }
    }
  }
  console.log('✅ Created subscriptions')

  // Create flags for admin testing
  if (allVideos.length >= 2) {
    await prisma.flag.create({
      data: {
        videoId: allVideos[0].id,
        reportedBy: users[2].id,
        reason: 'spam',
        status: 'pending',
      },
    })
    await prisma.flag.create({
      data: {
        videoId: allVideos[3].id,
        reportedBy: users[0].id,
        reason: 'misinformation',
        status: 'pending',
      },
    })
    await prisma.flag.create({
      data: {
        videoId: allVideos[7].id,
        reportedBy: users[1].id,
        reason: 'other',
        status: 'reviewed',
      },
    })
  }
  console.log('✅ Created flags for admin testing')

  // Create watch history for user1
  const user1 = users[0]
  for (let i = 0; i < 8; i++) {
    const video = allVideos[Math.floor(Math.random() * allVideos.length)]
    const daysAgo = Math.floor(Math.random() * 14)
    const watchedAt = new Date()
    watchedAt.setDate(watchedAt.getDate() - daysAgo)
    watchedAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

    await prisma.watchHistory.create({
      data: {
        userId: user1.id,
        videoId: video.id,
        watchedAt,
        progress: Math.random() > 0.3 ? 1.0 : Math.random(),
      },
    })
  }
  console.log('✅ Created watch history for user1')

  // Create saved videos for user1
  const savedVideoIds = new Set<string>()
  for (let i = 0; i < 5; i++) {
    let video: typeof allVideos[0]
    do {
      video = allVideos[Math.floor(Math.random() * allVideos.length)]
    } while (savedVideoIds.has(video.id))
    savedVideoIds.add(video.id)

    await prisma.savedVideo.create({
      data: {
        userId: user1.id,
        videoId: video.id,
      },
    })
  }
  console.log('✅ Created saved videos for user1')

  // Create playlists for each channel
  const playlistData = [
    // Channel 0 - Creative Queen
    [
      { title: 'Best Tutorials', description: 'My best art tutorials', videoIndices: [0, 2] },
      { title: 'Quick DIY', description: 'Fast and fun DIY projects', videoIndices: [1, 3] },
    ],
    // Channel 1 - Dance Vibes
    [
      { title: 'Viral Dances', description: 'The dances that went viral', videoIndices: [0, 2] },
    ],
    // Channel 2 - Foodie Shots
    [
      { title: 'Quick Recipes', description: 'Under 5 minute recipes', videoIndices: [2, 3] },
      { title: 'Food Adventures', description: 'Food from around the world', videoIndices: [1, 4] },
    ],
    // Channel 3 - Travel Vert
    [
      { title: 'Asia Adventures', description: 'Travel through Asia', videoIndices: [0, 1] },
    ],
    // Channel 4 - Tech Craft
    [
      { title: 'Beginner Guides', description: 'Tech guides for beginners', videoIndices: [4, 2] },
      { title: 'Setup Inspo', description: 'Desk and home setup inspiration', videoIndices: [1, 3] },
    ],
  ]

  // Calculate video index offsets for each channel
  const channelVideoOffsets = [0, 4, 7, 12, 15]

  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i]
    const playlists = playlistData[i]
    const offset = channelVideoOffsets[i]

    for (const pl of playlists) {
      const playlist = await prisma.playlist.create({
        data: {
          channelId: channel.id,
          title: pl.title,
          description: pl.description,
          isPublic: true,
        },
      })

      for (let pos = 0; pos < pl.videoIndices.length; pos++) {
        const videoIdx = offset + pl.videoIndices[pos]
        if (videoIdx < allVideos.length) {
          await prisma.playlistItem.create({
            data: {
              playlistId: playlist.id,
              videoId: allVideos[videoIdx].id,
              position: pos,
            },
          })
        }
      }
    }
  }
  console.log('✅ Created playlists for all channels')

  // Create sample notifications for user1 (recipient) triggered by other users
  await prisma.notification.deleteMany()

  const user1Channel = await prisma.channel.findFirst({
    where: { userId: users[0].id },
  })

  const sampleNotifications: Array<{
    userId: string
    type: string
    title: string
    message: string
    actorId: string
    relatedVideoId?: string
    relatedChannelId?: string
    isRead: boolean
    minutesAgo: number
  }> = [
    {
      userId: users[0].id,
      type: 'subscription',
      title: 'New subscriber',
      message: `${users[1].username} subscribed to your channel${user1Channel ? ` "${user1Channel.channelName}"` : ''}`,
      actorId: users[1].id,
      relatedChannelId: user1Channel?.id ?? null,
      isRead: false,
      minutesAgo: 2,
    },
    {
      userId: users[0].id,
      type: 'vote',
      title: 'Video liked',
      message: `Your video "${allVideos[0].title}" just got 10 new likes`,
      actorId: users[2].id,
      relatedVideoId: allVideos[0].id,
      isRead: false,
      minutesAgo: 47,
    },
    {
      userId: users[0].id,
      type: 'comment',
      title: 'New comment',
      message: `${users[2].username} commented: "Loved this! Watch till the end 🔥"`,
      actorId: users[2].id,
      relatedVideoId: allVideos[0].id,
      isRead: false,
      minutesAgo: 180,
    },
    {
      userId: users[0].id,
      type: 'system',
      title: 'Welcome to Vert',
      message: 'Thanks for joining! Complete your channel profile to start gaining subscribers.',
      actorId: users[0].id,
      isRead: true,
      minutesAgo: 60 * 24 * 3,
    },
  ]

  const now = Date.now()
  for (const n of sampleNotifications) {
    const { minutesAgo, ...fields } = n
    await prisma.notification.create({
      data: {
        ...fields,
        actorId: fields.actorId,
        createdAt: new Date(now - minutesAgo * 60 * 1000),
      },
    })
  }
  console.log(`✅ Created ${sampleNotifications.length} notifications for ${users[0].username}`)

  console.log('\n🎉 Seed completed successfully!')
  console.log('📧 Admin login: admin@vert.com / admin123')
  console.log('📧 User login: user1-5@vert.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

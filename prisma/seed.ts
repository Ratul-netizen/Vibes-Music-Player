import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (order matters for FKs)
  try { await (prisma as any).playlistTrack.deleteMany() } catch {}
  await prisma.song.deleteMany()
  await prisma.user.deleteMany()

  // Seed Users
  const users = await prisma.user.createMany({
    data: [
      {
        id: 'user-1',
        name: 'You',
        email: 'you@example.com',
        avatar: '🎧',
        status: 'online',
      },
      {
        id: 'user-2',
        name: 'DJ Alex',
        email: 'dj@example.com',
        avatar: '🎵',
        status: 'online',
      },
      {
        id: 'user-3',
        name: 'Music Fan',
        email: 'fan@example.com',
        avatar: '♪',
        status: 'away',
      },
    ],
  })

  console.log(`✅ Created ${users.count} users`)

  // Seed Songs - Generate sample songs
  const genres = ['Electronic', 'Pop', 'Rock', 'Jazz', 'Synthwave', 'Hip-Hop', 'Ambient', 'Indie', 'R&B', 'Country']
  const categories = ['Chill', 'Party', 'Romantic', 'Focus', 'Workout', 'Sleep', 'Energizing', 'Melancholic']
  const artists = [
    'Pink Floyd', 'Green Day', 'Linkin Park',
    'The Beatles', 'Queen', 'Coldplay', 'Radiohead', 'Muse', 'Arctic Monkeys',
    'Nirvana', 'Foo Fighters', 'Red Hot Chili Peppers'
  ]

  const songs = []
  for (let i = 0; i < 100; i++) {
    const durationMinutes = Math.floor(Math.random() * 4) + 2 // 2-6 minutes
    const durationSeconds = Math.floor(Math.random() * 60)
    const totalSeconds = durationMinutes * 60 + durationSeconds

    const artist = artists[i % artists.length]
    const bandTitlePrefixes = {
      'Pink Floyd': ['Echoes of', 'Shine On', 'Dark Side of', 'Wish You Were'],
      'Green Day': ['Boulevard of', 'American', 'Wake Me Up', 'Holiday in'],
      'Linkin Park': ['In the', 'Numb', 'Breaking the', 'Crawling in'],
    } as Record<string, string[]>
    const prefixList = bandTitlePrefixes[artist] || ['Song', 'Track', 'Tune', 'Melody']
    const titlePrefix = prefixList[i % prefixList.length]

    songs.push({
      id: `song-${i + 1}`,
      title: `${titlePrefix} ${i + 1}`,
      artist,
      album: `${artist} Essentials`,
      durationSeconds: totalSeconds,
      genre: genres[Math.floor(Math.random() * genres.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(i % 10) + 1}.mp3`,
      coverUrl: `https://picsum.photos/seed/${i + 1000}/400/400`,
      lyrics: `Lyrics for song ${i + 1}\n\nVerse 1\nChorus\nVerse 2`,
    })
  }

  const createdSongs = await prisma.song.createMany({
    data: songs,
  })

  console.log(`✅ Created ${createdSongs.count} songs`)

  // Build initial playlist using first 8 songs with varied votes
  const initialTracks = [
    { idx: 0, votes: 3 },
    { idx: 1, votes: -1 },
    { idx: 2, votes: 5 },
    { idx: 3, votes: 0 },
    { idx: 4, votes: 2 },
    { idx: 5, votes: 1 },
    { idx: 6, votes: 4 },
    { idx: 7, votes: 0 },
  ]

  const playlistItems = initialTracks.map((t, i) => ({
    trackId: `song-${t.idx + 1}`,
    position: i + 1,
    votes: t.votes,
    addedBy: i % 2 === 0 ? 'DJ Alex' : 'You',
    isPlaying: i === 0, // first item is now playing
  }))

  try {
    const createdPlaylist = await (prisma as any).playlistTrack.createMany({ data: playlistItems })
    console.log(`✅ Created ${createdPlaylist.count} playlist items (with now playing)`)  
  } catch (e) {
    console.log('ℹ️ Skipped playlist seed (model may be optional for this demo).')
  }

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


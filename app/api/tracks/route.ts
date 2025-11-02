import { NextResponse } from "next/server"
import { faker } from "@faker-js/faker"

const genres = ["Electronic", "Pop", "Rock", "Jazz", "Synthwave", "Hip-Hop", "Ambient", "Indie", "R&B", "Country"]
const categories = ["Chill", "Party", "Romantic", "Focus", "Workout", "Sleep", "Energizing", "Melancholic"]

// Generate 50 tracks with Faker.js
function generateTracks() {
  return Array.from({ length: 50 }).map((_, i) => {
    const durationMinutes = faker.number.int({ min: 2, max: 6 })
    const durationSeconds = faker.number.int({ min: 0, max: 59 })
    const totalSeconds = durationMinutes * 60 + durationSeconds

    return {
      id: `track-${i + 1}`,
      title: faker.music.songName(),
      artist: faker.person.firstName() + " " + faker.person.lastName(),
      album: faker.word.words({ count: { min: 2, max: 4 } }),
      genre: faker.helpers.arrayElement(genres),
      category: faker.helpers.arrayElement(categories),
      duration: `${durationMinutes}:${durationSeconds.toString().padStart(2, "0")}`,
      duration_seconds: totalSeconds,
      audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(i % 10) + 1}.mp3`,
      coverUrl: `https://picsum.photos/seed/${i + 1000}/400/400`,
      lyrics: faker.lorem.paragraphs({ min: 2, max: 4 }, "\n\n"),
    }
  })
}

// Cache tracks for consistency across requests
let cachedTracks: ReturnType<typeof generateTracks> | null = null

export async function GET() {
  if (!cachedTracks) {
    cachedTracks = generateTracks()
  }

  return NextResponse.json(cachedTracks, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}

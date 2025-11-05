import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { ensureWritableSqliteDb } from "@/lib/runtime-db"
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

ensureWritableSqliteDb()
const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limitParam = url.searchParams.get("limit")
    const limit = limitParam ? Math.max(1, Math.min(200, parseInt(limitParam))) : 100

    const songs = await prisma.song.findMany({
      take: limit,
      orderBy: { createdAt: "asc" },
    })

    const mapped = songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album || "",
      genre: s.genre,
      category: s.category || "",
      duration: `${Math.floor(s.durationSeconds / 60)}:${(s.durationSeconds % 60).toString().padStart(2, "0")}`,
      duration_seconds: s.durationSeconds,
      audioUrl: s.audioUrl || "",
      coverUrl: s.coverUrl || "/placeholder.svg",
      lyrics: s.lyrics || "",
    }))

    return NextResponse.json(mapped)
  } catch (e) {
    // Fallback to faker if Prisma not available
    const fallback = Array.from({ length: 50 }).map((_, i) => ({
      id: `track-${i + 1}`,
      title: faker.music.songName(),
      artist: faker.person.firstName() + " " + faker.person.lastName(),
      album: faker.word.words({ count: { min: 2, max: 4 } }),
      genre: faker.helpers.arrayElement(genres),
      category: faker.helpers.arrayElement(categories),
      duration: `${faker.number.int({ min: 2, max: 6 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, "0")}`,
      duration_seconds: faker.number.int({ min: 120, max: 420 }),
      audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(i % 10) + 1}.mp3`,
      coverUrl: `https://picsum.photos/seed/${i + 1000}/400/400`,
      lyrics: faker.lorem.paragraphs({ min: 2, max: 4 }, "\n\n"),
    }))
    return NextResponse.json(fallback)
  }
}

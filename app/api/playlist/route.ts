import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Read from Prisma if table exists; join with songs
    const items = await prisma.$queryRawUnsafe<any[]>(
      `SELECT pt.id, pt.track_id as trackId, pt.position, pt.votes, pt.added_by as addedBy,
              pt.added_at as addedAt, pt.is_playing as isPlaying, pt.played_at as playedAt,
              s.title, s.artist, s.album, s.duration_seconds as duration_seconds, s.genre, s.cover_url as cover_url
       FROM playlist_tracks pt
       JOIN songs s ON s.id = pt.track_id
       ORDER BY pt.position ASC`
    )

    const mapped = items.map((row) => ({
      id: row.id,
      track_id: row.trackId,
      position: row.position,
      votes: row.votes,
      added_by: row.addedBy,
      added_at: row.addedAt,
      is_playing: !!row.isPlaying,
      played_at: row.playedAt,
      track: {
        id: row.trackId,
        title: row.title,
        artist: row.artist,
        album: row.album,
        duration_seconds: row.duration_seconds,
        genre: row.genre,
        cover_url: row.cover_url,
      },
    }))

    return NextResponse.json(mapped)
  } catch (e: any) {
    // Fallback when table not available
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}

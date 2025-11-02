import { getDb, initDb } from "@/lib/db"
import { seedDatabase } from "@/lib/seed"
import { randomUUID } from "crypto"
import { broadcastEvent } from "@/lib/events"

export async function GET() {
  try {
    initDb()
    seedDatabase()

    const db = getDb()
    const items = db
      .prepare(
        `SELECT pt.*, t.title, t.artist, t.album, t.duration_seconds, t.genre, t.cover_url
        FROM playlist_tracks pt
        JOIN tracks t ON pt.track_id = t.id
        ORDER BY pt.position`,
      )
      .all() as any[]

    const formatted = items.map((item) => ({
      id: item.id,
      track_id: item.track_id,
      position: item.position,
      votes: item.votes,
      added_by: item.added_by,
      added_at: item.added_at,
      is_playing: item.is_playing === 1,
      played_at: item.played_at,
      track: {
        id: item.track_id,
        title: item.title,
        artist: item.artist,
        album: item.album,
        duration_seconds: item.duration_seconds,
        genre: item.genre,
        cover_url: item.cover_url,
      },
    }))

    return Response.json(formatted)
  } catch (error) {
    return Response.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { track_id, added_by = "Anonymous" } = await req.json()

    const db = getDb()

    // Check if track already in playlist
    const existing = db.prepare("SELECT id FROM playlist_tracks WHERE track_id = ?").get(track_id)
    if (existing) {
      return Response.json({ error: "Track already in playlist" }, { status: 400 })
    }

    // Get the last track position
    const lastTrack = db.prepare("SELECT position FROM playlist_tracks ORDER BY position DESC LIMIT 1").get() as
      | { position: number }
      | undefined

    const newPosition = lastTrack ? lastTrack.position + 1 : 1.0
    const playlistId = `playlist-${randomUUID()}`
    const now = new Date().toISOString()

    db.prepare(
      "INSERT INTO playlist_tracks (id, track_id, position, votes, added_by, added_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(playlistId, track_id, newPosition, 0, added_by, now)

    // Get the new item
    const newItem = db
      .prepare(
        `SELECT pt.*, t.title, t.artist, t.album, t.duration_seconds, t.genre, t.cover_url
        FROM playlist_tracks pt
        JOIN tracks t ON pt.track_id = t.id
        WHERE pt.id = ?`,
      )
      .get(playlistId) as any

    const formatted = {
      id: newItem.id,
      track_id: newItem.track_id,
      position: newItem.position,
      votes: newItem.votes,
      added_by: newItem.added_by,
      added_at: newItem.added_at,
      is_playing: newItem.is_playing === 1,
      track: {
        id: newItem.track_id,
        title: newItem.title,
        artist: newItem.artist,
        album: newItem.album,
        duration_seconds: newItem.duration_seconds,
        genre: newItem.genre,
        cover_url: newItem.cover_url,
      },
    }

    broadcastEvent({ type: "track.added", item: formatted })

    return Response.json(formatted, { status: 201 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to add track" }, { status: 500 })
  }
}

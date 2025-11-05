import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { ensureWritableSqliteDb } from "@/lib/runtime-db"
import { broadcastEvent } from "@/lib/events"

// Ensure DB file is placed in /tmp when running on Netlify
ensureWritableSqliteDb()
const prisma = new PrismaClient()

export async function GET() {
  try {
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
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const trackId: string = body.track_id
    const addedBy: string = body.added_by || "Anonymous"

    if (!trackId) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "track_id is required" } }, { status: 400 })
    }

    // prevent duplicate
    const existing = await prisma.playlistTrack.findFirst({ where: { trackId } } as any)
    if (existing) {
      return NextResponse.json(
        { error: { code: "DUPLICATE_TRACK", message: "This track is already in the playlist", details: { track_id: trackId } } },
        { status: 409 },
      )
    }

    // determine next position
    const last = await prisma.playlistTrack.findFirst({ orderBy: { position: "desc" } } as any)
    const position = last ? last.position + 1 : 1

    const created = await prisma.playlistTrack.create({
      data: {
        trackId,
        position,
        votes: 0,
        addedBy,
      },
    } as any)

    const row = await prisma.$queryRawUnsafe<any[]>(
      `SELECT pt.id, pt.track_id as trackId, pt.position, pt.votes, pt.added_by as addedBy,
              pt.added_at as addedAt, pt.is_playing as isPlaying, pt.played_at as playedAt,
              s.title, s.artist, s.album, s.duration_seconds as duration_seconds, s.genre, s.cover_url as cover_url
       FROM playlist_tracks pt
       JOIN songs s ON s.id = pt.track_id
       WHERE pt.id = ?`,
      created.id,
    )

    const result = {
      id: row[0].id,
      track_id: row[0].trackId,
      position: row[0].position,
      votes: row[0].votes,
      added_by: row[0].addedBy,
      added_at: row[0].addedAt,
      is_playing: !!row[0].isPlaying,
      played_at: row[0].playedAt,
      track: {
        id: row[0].trackId,
        title: row[0].title,
        artist: row[0].artist,
        album: row[0].album,
        duration_seconds: row[0].duration_seconds,
        genre: row[0].genre,
        cover_url: row[0].cover_url,
      },
    }

    broadcastEvent({ type: "track.added", item: result })
    return NextResponse.json(result, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to add track" }, { status: 500 })
  }
}

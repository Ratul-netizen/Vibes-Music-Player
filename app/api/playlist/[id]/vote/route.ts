import { getDb } from "@/lib/db"
import { broadcastEvent } from "@/lib/events"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { direction } = await req.json()

    if (!["up", "down"].includes(direction)) {
      return Response.json({ error: "Invalid direction" }, { status: 400 })
    }

    const db = getDb()
    const delta = direction === "up" ? 1 : -1

    db.prepare("UPDATE playlist_tracks SET votes = votes + ? WHERE id = ?").run(delta, id)

    const updated = db
      .prepare(
        `SELECT pt.*, t.title, t.artist, t.album, t.duration_seconds, t.genre, t.cover_url
        FROM playlist_tracks pt
        JOIN tracks t ON pt.track_id = t.id
        WHERE pt.id = ?`,
      )
      .get(id) as any

    const formatted = {
      id: updated.id,
      votes: updated.votes,
    }

    broadcastEvent({ type: "track.voted", item: formatted })

    return Response.json(formatted)
  } catch (error) {
    return Response.json({ error: "Failed to vote" }, { status: 500 })
  }
}

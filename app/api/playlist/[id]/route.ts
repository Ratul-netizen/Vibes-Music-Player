import { getDb } from "@/lib/db"
import { broadcastEvent } from "@/lib/events"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { position, is_playing } = await req.json()

    const db = getDb()

    if (is_playing) {
      // Only one track can be playing
      db.prepare("UPDATE playlist_tracks SET is_playing = 0").run()
    }

    const updates: string[] = []
    const values: any[] = []

    if (position !== undefined) {
      updates.push("position = ?")
      values.push(position)
    }

    if (is_playing !== undefined) {
      updates.push("is_playing = ?")
      values.push(is_playing ? 1 : 0)
    }

    if (updates.length === 0) {
      return Response.json({ error: "No updates provided" }, { status: 400 })
    }

    values.push(id)

    db.prepare(`UPDATE playlist_tracks SET ${updates.join(", ")} WHERE id = ?`).run(...values)

    // Get updated item
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
      track_id: updated.track_id,
      position: updated.position,
      votes: updated.votes,
      added_by: updated.added_by,
      added_at: updated.added_at,
      is_playing: updated.is_playing === 1,
    }

    if (is_playing) {
      broadcastEvent({ type: "track.playing", id })
    } else if (position !== undefined) {
      broadcastEvent({ type: "track.moved", item: formatted })
    }

    return Response.json(formatted)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to update track" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const db = getDb()
    db.prepare("DELETE FROM playlist_tracks WHERE id = ?").run(id)

    broadcastEvent({ type: "track.removed", id })

    return Response.json({}, { status: 204 })
  } catch (error) {
    return Response.json({ error: "Failed to delete track" }, { status: 500 })
  }
}

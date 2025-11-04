import { PrismaClient } from "@prisma/client"
import { broadcastEvent } from "@/lib/events"

const prisma = new PrismaClient()

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { position, is_playing } = await req.json()

    if (is_playing) {
      await prisma.playlistTrack.updateMany({ data: { isPlaying: false } } as any)
    }

    const updateData: any = {}
    if (position !== undefined) updateData.position = position
    if (is_playing !== undefined) updateData.isPlaying = !!is_playing
    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: "No updates provided" }, { status: 400 })
    }

    await prisma.playlistTrack.update({ where: { id }, data: updateData } as any)

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT pt.id, pt.track_id as trackId, pt.position, pt.votes, pt.added_by as addedBy,
              pt.added_at as addedAt, pt.is_playing as isPlaying
       FROM playlist_tracks pt WHERE pt.id = ?`,
      id,
    )

    const formatted = {
      id: rows[0].id,
      track_id: rows[0].trackId,
      position: rows[0].position,
      votes: rows[0].votes,
      added_by: rows[0].addedBy,
      added_at: rows[0].addedAt,
      is_playing: !!rows[0].isPlaying,
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

    await prisma.playlistTrack.delete({ where: { id } } as any)

    broadcastEvent({ type: "track.removed", id })

    return Response.json({}, { status: 204 })
  } catch (error) {
    return Response.json({ error: "Failed to delete track" }, { status: 500 })
  }
}

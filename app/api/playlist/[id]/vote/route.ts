import { PrismaClient } from "@prisma/client"
import { broadcastEvent } from "@/lib/events"

const prisma = new PrismaClient()

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { direction } = await req.json()

    if (!["up", "down"].includes(direction)) {
      return Response.json({ error: "Invalid direction" }, { status: 400 })
    }

    const delta = direction === "up" ? 1 : -1
    const updated = await prisma.playlistTrack.update({
      where: { id },
      data: { votes: { increment: delta } } as any,
    } as any)

    const formatted = { id: updated.id, votes: updated.votes }
    broadcastEvent({ type: "track.voted", item: formatted })
    return Response.json(formatted)
  } catch (error) {
    return Response.json({ error: "Failed to vote" }, { status: 500 })
  }
}

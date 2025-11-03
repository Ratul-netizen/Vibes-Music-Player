import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get("genre")
    const category = searchParams.get("category")
    const limit = searchParams.get("limit")

    const where: any = {}
    if (genre) where.genre = genre
    if (category) where.category = category

    const songs = await prisma.song.findMany({
      where,
      take: limit ? parseInt(limit) : undefined,
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(songs, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    console.error("Error fetching songs:", error)
    return NextResponse.json(
      { error: "Failed to fetch songs" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      artist,
      album,
      durationSeconds,
      genre,
      category,
      audioUrl,
      coverUrl,
      lyrics,
    } = body

    const song = await prisma.song.create({
      data: {
        title,
        artist,
        album,
        durationSeconds: durationSeconds || 0,
        genre,
        category,
        audioUrl,
        coverUrl,
        lyrics,
      },
    })

    return NextResponse.json(song, { status: 201 })
  } catch (error: any) {
    console.error("Error creating song:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create song" },
      { status: 500 }
    )
  }
}


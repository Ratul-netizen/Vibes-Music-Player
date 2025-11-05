import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { ensureWritableSqliteDb } from "@/lib/runtime-db"

ensureWritableSqliteDb()
const prisma = new PrismaClient()

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(users, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, avatar, status } = body

    const user = await prisma.user.create({
      data: {
        name,
        email,
        avatar,
        status: status || "online",
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    )
  }
}


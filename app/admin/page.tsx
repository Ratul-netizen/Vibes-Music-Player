"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Users, Music, Database } from "lucide-react"
import useSWR from "swr"

interface User {
  id: string
  name: string
  email: string | null
  avatar: string | null
  status: string
  createdAt: string
  updatedAt: string
}

interface Song {
  id: string
  title: string
  artist: string
  album: string | null
  durationSeconds: number
  genre: string
  category: string | null
  audioUrl: string | null
  coverUrl: string | null
  lyrics: string | null
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"users" | "songs">("users")

  const {
    data: users,
    error: usersError,
    isLoading: usersLoading,
    mutate: mutateUsers,
  } = useSWR<User[]>("/api/users", fetcher, {
    refreshInterval: 5000,
  })

  const {
    data: songs,
    error: songsError,
    isLoading: songsLoading,
    mutate: mutateSongs,
  } = useSWR<Song[]>("/api/songs", fetcher, {
    refreshInterval: 5000,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#1a1f2e] to-[#0a0f1c] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Database className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Database Viewer</h1>
          </div>
          <p className="text-muted-foreground">
            View and manage users and songs in the database
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Users ({users?.length || 0})
          </Button>
          <Button
            variant={activeTab === "songs" ? "default" : "outline"}
            onClick={() => setActiveTab("songs")}
            className="flex items-center gap-2"
          >
            <Music className="w-4 h-4" />
            Songs ({songs?.length || 0})
          </Button>
        </div>

        {/* Users Table */}
        {activeTab === "users" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Users</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutateUsers()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            {usersLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading users...
              </div>
            ) : usersError ? (
              <div className="text-center py-8 text-red-400">
                Error loading users: {usersError.message}
              </div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground">ID</th>
                      <th className="text-left p-3 text-muted-foreground">Name</th>
                      <th className="text-left p-3 text-muted-foreground">Email</th>
                      <th className="text-left p-3 text-muted-foreground">Avatar</th>
                      <th className="text-left p-3 text-muted-foreground">Status</th>
                      <th className="text-left p-3 text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          {user.id.slice(0, 8)}...
                        </td>
                        <td className="p-3 text-white">{user.name}</td>
                        <td className="p-3 text-muted-foreground">
                          {user.email || "—"}
                        </td>
                        <td className="p-3">
                          {user.avatar ? (
                            <span className="text-2xl">{user.avatar}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.status === "online"
                                ? "bg-green-500/20 text-green-400"
                                : user.status === "away"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No users found. Run the seed script to populate data.
              </div>
            )}
          </Card>
        )}

        {/* Songs Table */}
        {activeTab === "songs" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Songs</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutateSongs()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            {songsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading songs...
              </div>
            ) : songsError ? (
              <div className="text-center py-8 text-red-400">
                Error loading songs: {songsError.message}
              </div>
            ) : songs && songs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground">ID</th>
                      <th className="text-left p-3 text-muted-foreground">Title</th>
                      <th className="text-left p-3 text-muted-foreground">Artist</th>
                      <th className="text-left p-3 text-muted-foreground">Album</th>
                      <th className="text-left p-3 text-muted-foreground">Genre</th>
                      <th className="text-left p-3 text-muted-foreground">Category</th>
                      <th className="text-left p-3 text-muted-foreground">Duration</th>
                      <th className="text-left p-3 text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {songs.map((song) => (
                      <tr
                        key={song.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          {song.id.slice(0, 8)}...
                        </td>
                        <td className="p-3 text-white font-medium">{song.title}</td>
                        <td className="p-3 text-muted-foreground">{song.artist}</td>
                        <td className="p-3 text-muted-foreground">
                          {song.album || "—"}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                            {song.genre}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {song.category || "—"}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {formatDuration(song.durationSeconds)}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(song.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No songs found. Run the seed script to populate data.
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}


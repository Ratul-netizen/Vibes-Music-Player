"use client"

import { useState, useCallback, useRef, useEffect, type DragEvent } from "react"
import { TrackLibrary } from "@/components/track-library"
import { PlaylistTrackComponent } from "@/components/playlist-track"
import { NowPlaying } from "@/components/now-playing"
import { NowPlayingBubble } from "@/components/now-playing-bubble"
import { MusicBanner } from "@/components/music-banner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Heart, MessageCircle } from "lucide-react"
import { PlaylistControls } from "@/components/playlist-controls"
import { PlaylistStats } from "@/components/playlist-stats"
import { PlaylistHeader } from "@/components/playlist-header"
import { PlaylistAdvancedMenu } from "@/components/playlist-advanced-menu"
import { PlaylistFavorites } from "@/components/playlist-favorites"
import { UserPresence, type User } from "@/components/user-presence"
import { ChatPanel } from "@/components/chat-panel"
import { type Message } from "@/components/chat-message"
import { PresenceIndicator } from "@/components/presence-indicator"
import { SettingsPanel, type UserSettings } from "@/components/settings-panel"
import { AnalyticsDashboard, type Analytics, type PlayHistoryItem } from "@/components/analytics-dashboard"
import { useWebSocket } from "@/hooks/use-websocket"
import { socket } from "@/lib/socket"
import { getPersistentState, setPersistentState } from "@/lib/persisted-state"
import { EqualizerVisualizer } from "@/components/equalizer-visualizer"
import { AlbumArtDisplay } from "@/components/album-art-display"
import { useSwipe } from "@/hooks/use-swipe"
import { ShareDialog } from "@/components/share-dialog"
import { usePlayerStore, type PlayerState } from "@/store/use-player-store"
import { motion } from "framer-motion"
import { calculatePosition } from "@/lib/position"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration_seconds: number
  genre: string
  category?: string
  audioUrl?: string
  coverUrl?: string
  lyrics?: string
  duration?: string
}

interface PlaylistItem {
  id: string
  track_id: string
  track: Track
  position: number
  votes: number
  added_by: string
  added_at: string
  is_playing: boolean
  is_favorite?: boolean
}

export default function Home() {
  const { isConnected } = useWebSocket()
  // Respect env flag to disable websocket UI if not desired
  const wsEnabled = process.env.NEXT_PUBLIC_WS_ENABLED !== "false"
  const { currentTrack, isPlaying: storeIsPlaying, setProgress } = usePlayerStore()
  const [tracks, setTracks] = useState<Track[]>([])
  const [tracksLoading, setTracksLoading] = useState(true)

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = getPersistentState("user-settings", {
      theme: "neon-pulse",
      volume: 75,
      autoPlay: true,
      notifications: true,
      highContrast: false,
      compactMode: false,
      animationsEnabled: true,
    } as UserSettings)
    return saved
  })

  const handleSettingsChange = (newSettings: UserSettings) => {
    setSettings(newSettings)
    setPersistentState("user-settings", newSettings)
  }

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([])
  const [draggedItem, setDraggedItem] = useState<PlaylistItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off")
  const [sortBy, setSortBy] = useState<"position" | "votes" | "date-added" | "title">("position")
  const [favorites, setFavorites] = useState<PlaylistItem[]>([])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "sys1",
      userId: "system",
      userName: "System",
      content: "Welcome to the collaborative playlist! 🎵",
      timestamp: new Date(Date.now() - 120000),
      type: "system",
    },
  ])
  const [currentUser] = useState({ id: "user-1", name: "You" })
  const [users, setUsers] = useState<User[]>([
    { id: "user-1", name: "You", status: "online", avatar: "🎧" },
    { id: "user-2", name: "DJ Alex", status: "online", avatar: "🎵" },
    { id: "user-3", name: "Music Fan", status: "away", avatar: "♪" },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string>()
  const [showChat, setShowChat] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const playbackProgress = usePlayerStore((state: PlayerState) => state.progress)

  const [history, setHistory] = useState<PlayHistoryItem[]>([
    {
      id: "h1",
      title: "Midnight Dreams",
      artist: "The Echoes",
      playedAt: new Date(Date.now() - 86400000),
      duration: 240,
      votes: 3,
    },
    {
      id: "h2",
      title: "Summer Breeze",
      artist: "Luna Sky",
      playedAt: new Date(Date.now() - 172800000),
      duration: 200,
      votes: 2,
    },
    {
      id: "h3",
      title: "Urban Jungle",
      artist: "City Beats",
      playedAt: new Date(Date.now() - 259200000),
      duration: 280,
      votes: 5,
    },
  ])

  const [analytics, setAnalytics] = useState<Analytics>({
    totalTracksPlayed: 47,
    totalPlaytime: 189600,
    mostPlayedGenre: "Electronic",
    averageVotesPerTrack: 2.4,
    topArtist: "The Echoes",
    sessionCount: 12,
    dailyPlayHistory: [
      { date: "Mon", count: 8 },
      { date: "Tue", count: 12 },
      { date: "Wed", count: 10 },
      { date: "Thu", count: 15 },
      { date: "Fri", count: 18 },
      { date: "Sat", count: 20 },
      { date: "Sun", count: 14 },
    ],
    genreDistribution: [
      { name: "Electronic", value: 18 },
      { name: "Pop", value: 12 },
      { name: "Hip-Hop", value: 10 },
      { name: "Ambient", value: 5 },
      { name: "Synthwave", value: 2 },
    ],
    topTracks: [
      { title: "Midnight Dreams", artist: "The Echoes", plays: 8 },
      { title: "Urban Jungle", artist: "City Beats", plays: 6 },
      { title: "Summer Breeze", artist: "Luna Sky", plays: 5 },
      { title: "Cosmic Journey", artist: "Space Travelers", plays: 4 },
      { title: "Electric Heart", artist: "Neon Lights", plays: 3 },
    ],
  })

  const messageIdRef = useRef(1000)

  // Fetch tracks and playlist from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setTracksLoading(true)
        const [tracksRes, playlistRes] = await Promise.all([
          fetch("/api/tracks"),
          fetch("/api/playlist"),
        ])
        const tracksJson = await tracksRes.json()
        const playlistJson = await playlistRes.json()
        setTracks(tracksJson)
        if (Array.isArray(playlistJson)) setPlaylist(playlistJson)
      } catch (error) {
        console.error("Failed to load initial data", error)
      } finally {
        setTracksLoading(false)
      }
    }
    fetchData()
  }, [])

  const playlistTrackIds = new Set<string>(playlist.map((item: PlaylistItem) => item.track_id))

  useEffect(() => {
    const root = document.documentElement
    const themeClass = `theme-${settings.theme}`
    root.className = themeClass
  }, [settings.theme])

  const handleSendMessage = useCallback(
    (content: string) => {
      const newMessage: Message = {
        id: `msg${messageIdRef.current++}`,
        userId: currentUser.id,
        userName: currentUser.name,
        content,
        timestamp: new Date(),
        type: "message",
      }

      setMessages((prev: Message[]) => [...prev, newMessage])
    },
    [currentUser],
  )

  // Add
  const handleAddTrack = useCallback(
    async (track: Track) => {
      // Optimistic: prevent dups
      if (playlist.some((p) => p.track_id === track.id)) {
        setError("Track is already in the playlist")
        return
      }
      try {
        const res = await fetch("/api/playlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track_id: track.id, added_by: currentUser.name }),
        })
        const created = await res.json()
        if (!res.ok) throw created
        setPlaylist((prev) => [...prev, created])
        ;(socket as any).emit("track:add", { item: created })
      } catch (e: any) {
        setError(e?.error?.message || "Failed to add track")
      }
    },
    [playlist, currentUser.name],
  )

  // Remove
  const handleRemoveTrack = useCallback(async (id: string) => {
    const previous = playlist
    setPlaylist((prev) => prev.filter((p) => p.id !== id))
    try {
      const res = await fetch(`/api/playlist/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("delete failed")
      ;(socket as any).emit("track:remove", { id })
    } catch {
      setPlaylist(previous)
      setError("Failed to remove track")
    }
  }, [playlist])

  // Vote
  const handleVote = useCallback(
    async (id: string, direction: "up" | "down") => {
      const delta = direction === "up" ? 1 : -1
      setPlaylist((prev) => prev.map((i) => (i.id === id ? { ...i, votes: i.votes + delta } : i)))
      try {
        const res = await fetch(`/api/playlist/${id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction }),
        })
        const updated = await res.json()
        if (!res.ok) throw updated
        setPlaylist((prev) => prev.map((i) => (i.id === id ? { ...i, votes: updated.votes } : i)))
        ;(socket as any).emit("track:vote", { id, votes: updated.votes })
      } catch (e) {
        // revert on failure
        setPlaylist((prev) => prev.map((i) => (i.id === id ? { ...i, votes: i.votes - delta } : i)))
        setError("Failed to vote")
      }
    },
    [],
  )

  const handleToggleFavorite = useCallback(
    (id: string) => {
      setPlaylist((prev: PlaylistItem[]) => prev.map((item: PlaylistItem) => (item.id === id ? { ...item, is_favorite: !item.is_favorite } : item)))

      setFavorites((prev: PlaylistItem[]) => {
        const item = playlist.find((p: PlaylistItem) => p.id === id)
        if (!item) return prev

        const isFavorited = prev.some((p: PlaylistItem) => p.id === id)
        if (isFavorited) {
          return prev.filter((p: PlaylistItem) => p.id !== id)
        } else {
          return [...prev, item]
        }
      })
    },
    [playlist],
  )

  const handleDragStart = (item: PlaylistItem) => (e: DragEvent) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  // Reorder using fractional positions
  const handleDropBetween = (targetItem: PlaylistItem | null, isAfter: boolean) => {
    if (!draggedItem) return
    if (draggedItem.id === targetItem?.id) return

    setPlaylist((prev) => {
      const ordered = [...prev].sort((a, b) => a.position - b.position)
      const draggedIndex = ordered.findIndex((i) => i.id === draggedItem.id)

      let insertIndex = targetItem ? ordered.findIndex((i) => i.id === targetItem.id) : ordered.length
      if (isAfter && insertIndex >= 0) insertIndex += 1

      const prevNeighbor = ordered[insertIndex - 1] || null
      const nextNeighbor = ordered[insertIndex] || null
      const newPos = calculatePosition(prevNeighbor?.position ?? null, nextNeighbor?.position ?? null)

      // optimistic update
      const next = prev.map((i) => (i.id === draggedItem.id ? { ...i, position: newPos } : i))
      // persist
      fetch(`/api/playlist/${draggedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: newPos }),
      })
        .then(() => {
          ;(socket as any).emit("track:reorder", { id: draggedItem.id })
        })
        .catch(() => setError("Failed to reorder"))

      return next
    })

    setDraggedItem(null)
  }

  const handleSetPlaying = useCallback(
    async (id: string) => {
      // optimistic
      setPlaylist((prev) => prev.map((i) => ({ ...i, is_playing: i.id === id })))
      setIsPlaying(true)
      setProgress(0)

      const playingTrack = playlist.find((p) => p.id === id)
      if (playingTrack) {
        usePlayerStore.getState().setTrack(playingTrack.track)
      }

      try {
        await fetch(`/api/playlist/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_playing: true }),
        })
        ;(socket as any).emit("track:playing", { id })
        if (playingTrack) {
          setHistory((prev) => [
            {
              id: `h${Date.now()}`,
              title: playingTrack.track.title,
              artist: playingTrack.track.artist,
              playedAt: new Date(),
              duration: playingTrack.track.duration_seconds,
              votes: playingTrack.votes,
            },
            ...prev.slice(0, 49),
          ])
        }
      } catch {
        setError("Failed to set playing")
      }
    },
    [playlist, setProgress],
  )

  const handleTogglePlay = useCallback(() => {
    usePlayerStore.getState().togglePlay()
    setIsPlaying((prev: boolean) => !prev)
  }, [])

  const handleSkipToNext = useCallback(() => {
    setPlaylist((prev: PlaylistItem[]) => {
      const sorted = [...prev].sort((a: PlaylistItem, b: PlaylistItem) => a.position - b.position)
      const currentIndex = sorted.findIndex((item: PlaylistItem) => item.is_playing)
      const nextIndex = (currentIndex + 1) % sorted.length

      return sorted.map((item: PlaylistItem) => ({
        ...item,
        is_playing: item.id === sorted[nextIndex].id,
      }))
    })
  }, [])

  // Simulate playback progress - sync with store
  useEffect(() => {
    if (!storeIsPlaying || !currentTrack) {
      setProgress(0)
      return
    }

    const duration = currentTrack.duration_seconds
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress = currentProgress + (100 / duration)
      if (currentProgress >= 100) {
        usePlayerStore.getState().setIsPlaying(false)
        handleSkipToNext()
        setProgress(0)
        currentProgress = 0
      } else {
        setProgress(currentProgress)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [storeIsPlaying, currentTrack, handleSkipToNext, setProgress])

  const handleSkipToPrevious = useCallback(() => {
    setPlaylist((prev: PlaylistItem[]) => {
      const sorted = [...prev].sort((a: PlaylistItem, b: PlaylistItem) => a.position - b.position)
      const currentIndex = sorted.findIndex((item: PlaylistItem) => item.is_playing)
      const prevIndex = (currentIndex - 1 + sorted.length) % sorted.length

      return sorted.map((item: PlaylistItem) => ({
        ...item,
        is_playing: item.id === sorted[prevIndex].id,
      }))
    })
  }, [])

  const handleShuffle = useCallback(() => {
    setPlaylist((prev: PlaylistItem[]) => {
      const shuffled = [...prev].sort(() => Math.random() - 0.5)
      return shuffled.map((item: PlaylistItem, idx: number) => ({
        ...item,
        position: idx + 1,
      }))
    })
  }, [])

  const handleRepeat = useCallback((mode: "off" | "all" | "one") => {
    setRepeatMode(mode)
  }, [])

  const handleSortChange = useCallback((newSortBy: "position" | "votes" | "date-added" | "title") => {
    setSortBy(newSortBy)
  }, [])

  const handleExportPlaylist = useCallback(() => {
    const exportData = {
      name: "Collaborative Playlist",
      exportDate: new Date().toISOString(),
      tracks: playlist.map((item) => ({
        title: item.track.title,
        artist: item.track.artist,
        votes: item.votes,
        addedBy: item.added_by,
        addedAt: item.added_at,
      })),
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `playlist-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)

    setError(null)
  }, [playlist])

  // Realtime listeners
  useEffect(() => {
    const offAdded = socket.on("track:added" as any, (data: any) => {
      const item = (data as any).item
      setPlaylist((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item]))
    })
    const offRemoved = socket.on("track:removed" as any, (data: any) => {
      setPlaylist((prev) => prev.filter((p) => p.id !== (data as any).id))
    })
    const offVoted = socket.on("track:voted" as any, (data: any) => {
      setPlaylist((prev) => prev.map((p) => (p.id === (data as any).id ? { ...p, votes: (data as any).votes } : p)))
    })
    const offReordered = socket.on("track:reordered" as any, () => {
      // Playlist will be updated by patch response optimistically; optional refetch could be added
    })
    const offPlaying = socket.on("track:playing" as any, (data: any) => {
      const id = (data as any).id
      setPlaylist((prev) => prev.map((i) => ({ ...i, is_playing: i.id === id })))
    })
    return () => {
      offAdded?.()
      offRemoved?.()
      offVoted?.()
      offReordered?.()
      offPlaying?.()
    }
  }, [])

  const totalDuration = playlist.reduce((sum: number, item: PlaylistItem) => sum + item.track.duration_seconds, 0)
  const totalVotes = playlist.reduce((sum: number, item: PlaylistItem) => sum + item.votes, 0)
  const averageRating = playlist.length > 0 ? totalVotes / playlist.length : 0
  const mostVotedTrack =
    playlist.length > 0 ? playlist.reduce((max: PlaylistItem, item: PlaylistItem) => (item.votes > max.votes ? item : max)).track.title : null

  const sortedPlaylist = [...playlist].sort((a: PlaylistItem, b: PlaylistItem) => {
    switch (sortBy) {
      case "votes":
        return b.votes - a.votes
      case "date-added":
        return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      case "title":
        return a.track.title.localeCompare(b.track.title)
      case "position":
      default:
        return a.position - b.position
    }
  })

  const currentlyPlaying = playlist.find((item: PlaylistItem) => item.is_playing) || null

  // Sync playlist state with player store
  useEffect(() => {
    if (currentlyPlaying?.track && currentTrack?.id !== currentlyPlaying.track.id) {
      usePlayerStore.getState().setTrack(currentlyPlaying.track)
      setIsPlaying(true)
    }
  }, [currentlyPlaying, currentTrack])
  
  // Sync store playing state back to local state
  useEffect(() => {
    setIsPlaying(storeIsPlaying)
  }, [storeIsPlaying])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+/ or Cmd+/ to toggle chat
      const target = e.target as HTMLElement | null
      const isTyping = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      if (!isTyping) {
        if ((e.ctrlKey || e.metaKey) && e.key === "/") {
          e.preventDefault()
          setShowChat((prev: boolean) => !prev)
        }
      }
      // Esc to close chat
      if (e.key === "Escape" && showChat) {
        setShowChat(false)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [showChat])

  const connectionIndicator = !wsEnabled ? null : isConnected ? (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 text-xs text-green-500"
    >
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <motion.div
          className="absolute inset-0 w-2 h-2 rounded-full bg-green-500"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.75, 0, 0.75]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      <span>Connected</span>
    </motion.div>
  ) : (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 text-xs text-yellow-500"
    >
      <motion.div
        className="w-2 h-2 rounded-full bg-yellow-500"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <span>Offline Mode</span>
    </motion.div>
  )

  const swipeHandlers = useSwipe(
    () => handleSkipToNext(), // onSwipeLeft - skip to next
    () => handleSkipToPrevious(), // onSwipeRight - skip to previous
  )

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex flex-col" {...swipeHandlers}>
      <div className="bg-ambient" />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-white/10 relative z-50 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <PlaylistHeader playlistName="Vibes" connectedUsers={users.length} isLive={isConnected} />
              {connectionIndicator}
            </div>
            <div className="flex items-center gap-3">
              <PresenceIndicator isLive={true} userCount={users.filter((u: User) => u.status === "online").length} />
              <Button
                size="sm"
                variant={showChat ? "default" : "outline"}
                className="gap-2"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </Button>
              <ShareDialog playlistName="Collaborative Playlist" trackCount={playlist.length} />
              <AnalyticsDashboard analytics={analytics} history={history} />
              <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 px-6 pb-24 lg:pb-28 overflow-y-auto">
          {/* Music Banner */}
          <div className="shrink-0 pt-6 mb-6">
            <MusicBanner />
          </div>
          {error && (
          <Card className="mb-4 p-3 bg-destructive/10 border-destructive text-destructive flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setError(null)}>
              ✕
            </Button>
          </Card>
        )}

        {/* Mobile layout */}
        {isMobile && (
          <div className="flex flex-col gap-4 overflow-y-auto pb-20">
            <div className="glass p-4 rounded-lg">
              <NowPlaying
                track={currentlyPlaying?.track}
                onSkip={handleSkipToNext}
                onPlayNext={handleSkipToNext}
                duration={300}
              />
            </div>

            <div className="glass p-4 rounded-lg">
              <h2 className="text-lg font-bold mb-3">Queue</h2>
              <div className="space-y-2 overflow-y-auto max-h-[400px]">
                {sortedPlaylist.slice(0, 10).map((item) => (
                  <PlaylistTrackComponent
                    key={item.id}
                    id={item.id}
                    track={item.track}
                    position={item.position}
                    votes={item.votes}
                    is_playing={item.is_playing}
                    added_by={item.added_by}
                    onDragStart={handleDragStart(item)}
                    onRemove={() => handleRemoveTrack(item.id)}
                    onVote={(direction) => handleVote(item.id, direction)}
                    onSetPlaying={() => handleSetPlaying(item.id)}
                  />
                ))}
              </div>
            </div>

            <div className="glass p-4 rounded-lg">
              <h2 className="text-lg font-bold mb-3">Library</h2>
              <TrackLibrary
                tracks={tracks}
                playlistTrackIds={playlistTrackIds}
                onAddTrack={handleAddTrack}
                onPlayTrack={(track: Track) => {
                  const existingItem = playlist.find((item: PlaylistItem) => item.track_id === track.id)
                  if (existingItem) {
                    handleSetPlaying(existingItem.id)
                  } else {
                    handleAddTrack(track)
                    setTimeout(() => {
                      const newItem = playlist.find((item: PlaylistItem) => item.track_id === track.id)
                      if (newItem) handleSetPlaying(newItem.id)
                    }, 100)
                  }
                }}
                isLoading={tracksLoading}
              />
            </div>
          </div>
        )}

        {/* Desktop layout */}
        {!isMobile && (
          <div className="h-full min-h-0 grid grid-cols-12 gap-6">
            <div className="col-span-3 flex flex-col gap-4 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent pr-2">
              <PlaylistControls
                onShuffle={handleShuffle}
                onRepeat={handleRepeat}
                totalTracks={playlist.length}
                totalDuration={totalDuration}
              />
              <PlaylistStats
                totalTracks={playlist.length}
                averageRating={averageRating}
                mostVotedTrack={mostVotedTrack}
                totalDuration={totalDuration}
              />
              {favorites.length > 0 && (
                <PlaylistFavorites
                  favorites={favorites}
                  onAddFavorite={() => {}}
                  onRemoveFavorite={(id: string) => {
                    setFavorites((prev: PlaylistItem[]) => prev.filter((p: PlaylistItem) => p.id !== id))
                  }}
                />
              )}
              <UserPresence users={users} currentUserId={currentUser.id} />
            </div>

            <div className={`${showChat ? "col-span-6" : "col-span-9"} flex flex-col gap-4 min-h-0`}>
              <div className="glass p-4 rounded-lg overflow-hidden flex flex-col flex-9 min-h-0">
                <TrackLibrary
                  tracks={tracks}
                  playlistTrackIds={playlistTrackIds}
                  onAddTrack={handleAddTrack}
                  onPlayTrack={(track: Track) => {
                    const existingItem = playlist.find((item: PlaylistItem) => item.track_id === track.id)
                    if (existingItem) {
                      handleSetPlaying(existingItem.id)
                    } else {
                      handleAddTrack(track)
                      setTimeout(() => {
                        const newItem = playlist.find((item: PlaylistItem) => item.track_id === track.id)
                        if (newItem) handleSetPlaying(newItem.id)
                      }, 100)
                    }
                  }}
                  isLoading={tracksLoading}
                />
              </div>

              <div className="flex-3 flex flex-col gap-4 overflow-visible min-h-0">

                <PlaylistAdvancedMenu
                  playlist={sortedPlaylist}
                  onSortChange={handleSortChange}
                  onExportPlaylist={handleExportPlaylist}
                />

                <div className="flex-1 flex flex-col overflow-visible min-h-[520px] md:min-h-[600px] lg:min-h-[720px]">
                  <h2 className="text-lg font-bold mb-3">Queue ({sortedPlaylist.length})</h2>
                  <div
                    className="flex-1 space-y-2 pr-2 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent"
                    onDragOver={handleDragOver}
                    onDrop={(e: DragEvent) => {
                      e.preventDefault()
                      handleDropBetween(null, false)
                    }}
                  >
                    {sortedPlaylist.map((item: PlaylistItem) => (
                      <div
                        key={item.id}
                        className="relative group"
                        onDragOver={(e: DragEvent) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = "move"
                        }}
                        onDrop={(e: DragEvent) => {
                          e.preventDefault()
                          handleDropBetween(item, false)
                        }}
                      >
                        <div className="absolute -top-2 -right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleToggleFavorite(item.id)}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                item.is_favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                              }`}
                            />
                          </Button>
                        </div>
                        <PlaylistTrackComponent
                          id={item.id}
                          track={item.track}
                          position={item.position}
                          votes={item.votes}
                          is_playing={item.is_playing}
                          added_by={item.added_by}
                          onDragStart={handleDragStart(item)}
                          onRemove={() => handleRemoveTrack(item.id)}
                          onVote={(direction) => handleVote(item.id, direction)}
                          onSetPlaying={() => handleSetPlaying(item.id)}
                        />
                      </div>
                    ))}

                    {sortedPlaylist.length === 0 && (
                      <Card className="p-8 text-center text-muted-foreground">
                        <p>Playlist is empty. Add tracks from the library to get started.</p>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {showChat && (
              <div className="col-span-3 overflow-hidden h-full">
                <ChatPanel
                  messages={messages}
                  currentUserId={currentUser.id}
                  currentUserName={currentUser.name}
                  onSendMessage={handleSendMessage}
                  isTyping={isTyping}
                  typingUser={typingUser}
                  onClose={() => setShowChat(false)}
                />
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Now Playing Bubble Player - Fixed at bottom right */}
      <NowPlayingBubble 
        onSkipNext={handleSkipToNext} 
        onSkipPrevious={handleSkipToPrevious}
        onShuffle={handleShuffle}
        onRepeat={() => {
          const modes: ("off" | "all" | "one")[] = ["off", "all", "one"]
          const currentIndex = modes.indexOf(repeatMode)
          const nextMode = modes[(currentIndex + 1) % modes.length]
          handleRepeat(nextMode)
        }}
        shuffleActive={sortBy === "position"} // Shuffle is active when sorted by position after shuffle
        repeatMode={repeatMode}
      />
    </div>
  )
}

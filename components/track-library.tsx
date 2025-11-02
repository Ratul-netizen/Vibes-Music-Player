"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Play, LayoutGrid, List } from "lucide-react"
import { usePlayerStore } from "@/store/use-player-store"
import { motion, AnimatePresence } from "framer-motion"
import { formatTime } from "@/lib/utils"

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

interface TrackLibraryProps {
  tracks: Track[]
  playlistTrackIds: Set<string>
  onAddTrack: (track: Track) => void
  onPlayTrack?: (track: Track) => void
  isLoading: boolean
}

/**
 * TrackLibrary Component
 *
 * Displays the available track library with search and genre filtering capabilities.
 * Allows users to add tracks to the collaborative playlist.
 *
 * @component
 * @param tracks - Array of available Track objects
 * @param playlistTrackIds - Set of track IDs already in the playlist
 * @param onAddTrack - Callback function when a track is added
 * @param isLoading - Boolean indicating if tracks are being loaded
 *
 * @example
 * <TrackLibrary
 *   tracks={[...]}
 *   playlistTrackIds={new Set(['id1', 'id2'])}
 *   onAddTrack={(track) => addToPlaylist(track)}
 *   isLoading={false}
 * />
 */

export function TrackLibrary({ tracks, playlistTrackIds, onAddTrack, onPlayTrack, isLoading }: TrackLibraryProps) {
  const { setTrack, currentTrack } = usePlayerStore()
  const [search, setSearch] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const genres = useMemo(() => [...new Set(tracks.map((t) => t.genre))].sort(), [tracks])
  const categories = useMemo(
    () => [...new Set(tracks.map((t) => t.category).filter((c): c is string => !!c))].sort(),
    [tracks],
  )

  const filtered = useMemo(() => {
    return tracks.filter((track) => {
      const matchesSearch =
        track.title.toLowerCase().includes(search.toLowerCase()) ||
        track.artist.toLowerCase().includes(search.toLowerCase()) ||
        track.album.toLowerCase().includes(search.toLowerCase())
      const matchesGenre = !selectedGenre || track.genre === selectedGenre
      const matchesCategory = !selectedCategory || track.category === selectedCategory
      return matchesSearch && matchesGenre && matchesCategory
    })
  }, [tracks, search, selectedGenre, selectedCategory])

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tracks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              className="h-9"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "outline"}
              onClick={() => setViewMode("grid")}
              className="h-9"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {(genres.length > 0 || categories.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {genres.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Genre</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={selectedGenre === null ? "default" : "outline"}
                    onClick={() => setSelectedGenre(null)}
                    className="rounded-full"
                  >
                    All
                  </Button>
                  {genres.map((g) => (
                    <Button
                      key={g}
                      size="sm"
                      variant={selectedGenre === g ? "default" : "outline"}
                      onClick={() => setSelectedGenre(g)}
                      className="rounded-full"
                    >
                      {g}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {categories.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Category</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={selectedCategory === null ? "default" : "outline"}
                    onClick={() => setSelectedCategory(null)}
                    className="rounded-full"
                  >
                    All
                  </Button>
                  {categories.map((c) => (
                    <Button
                      key={c}
                      size="sm"
                      variant={selectedCategory === c ? "default" : "outline"}
                      onClick={() => setSelectedCategory(c)}
                      className="rounded-full"
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-32"
            >
              <div className="text-muted-foreground text-sm">Loading tracks...</div>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-32"
            >
              <div className="text-muted-foreground text-sm">No tracks found</div>
            </motion.div>
          ) : viewMode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {filtered.map((track) => {
                const isInPlaylist = playlistTrackIds.has(track.id)
                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-3 hover:bg-muted transition-colors group relative overflow-hidden">
                      {/* Glowing left border when playing */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTrack(track)
                              onPlayTrack?.(track)
                            }}
                          >
                            <Play className="w-4 h-4 text-purple-400" />
                          </Button>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          {track.duration || formatTime(track.duration_seconds)}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onAddTrack(track)}
                          disabled={isInPlaylist || isLoading}
                          className={isInPlaylist ? "opacity-50" : "hover:scale-110 transition-transform"}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[220px]"
            >
              {filtered.map((track, idx) => {
                const isInPlaylist = playlistTrackIds.has(track.id)
                const coverUrl = track.coverUrl || "/placeholder.svg"
                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                  >
                    <Card className={`p-0 hover:bg-muted transition-all group relative overflow-hidden hover:ring-2 hover:ring-purple-500/50 rounded-xl ${
                      currentTrack?.id === track.id
                        ? "border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                        : "border-transparent"
                    }`}>
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={coverUrl}
                          alt={track.album}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/20"
                          onClick={() => {
                            setTrack(track)
                            onPlayTrack?.(track)
                          }}
                        >
                          <Play className="w-8 h-8 text-white" />
                        </Button>
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {track.duration || formatTime(track.duration_seconds)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onAddTrack(track)}
                            disabled={isInPlaylist || isLoading}
                            className={`h-6 w-6 p-0 ${isInPlaylist ? "opacity-50" : ""}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

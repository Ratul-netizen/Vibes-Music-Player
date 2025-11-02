"use client"

import type React from "react"

import { GripVertical, Trash2, ThumbsUp, ThumbsDown, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatTime } from "@/lib/utils"

interface PlaylistTrackProps {
  id: string
  track: {
    title: string
    artist: string
    duration_seconds: number
  }
  position: number
  votes: number
  is_playing: boolean
  added_by: string
  onDragStart: (e: React.DragEvent) => void
  onRemove: () => void
  onVote: (direction: "up" | "down") => void
  onSetPlaying: () => void
}

/**
 * PlaylistTrackComponent
 *
 * Displays a single track in the playlist queue with controls for voting,
 * removal, and drag-and-drop reordering.
 *
 * @component
 * @example
 * <PlaylistTrackComponent
 *   id="item-1"
 *   track={{ id: "t1", title: "Song", artist: "Artist", ... }}
 *   position={1.0}
 *   votes={5}
 *   is_playing={false}
 *   added_by="User"
 *   onDragStart={(e) => ...}
 *   onRemove={() => ...}
 *   onVote={(dir) => ...}
 *   onSetPlaying={() => ...}
 * />
 */
export function PlaylistTrackComponent({
  id,
  track,
  votes,
  is_playing,
  added_by,
  onDragStart,
  onRemove,
  onVote,
  onSetPlaying,
}: PlaylistTrackProps) {
  return (
    <Card
      className={`p-3 cursor-move transition-all duration-200 ${
        is_playing ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500" : "hover:bg-muted"
      }`}
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex items-center gap-2">
        <GripVertical className={`w-5 h-5 ${is_playing ? "text-purple-500" : "text-muted-foreground"}`} />

        <button
          onClick={onSetPlaying}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            is_playing ? "bg-purple-500 text-white" : "bg-muted hover:bg-accent"
          }`}
        >
          {is_playing ? <span className="animate-pulse text-lg">♫</span> : <Music className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-foreground">{track.title}</p>
          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
        </div>

        <div className="text-xs text-muted-foreground flex-shrink-0">{formatTime(track.duration_seconds)}</div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onVote("up")}>
            <ThumbsUp className={`w-4 h-4 ${votes > 0 ? "fill-green-500 text-green-500" : ""}`} />
          </Button>
          <span
            className={`text-xs font-semibold w-6 text-center ${votes > 0 ? "text-green-500" : votes < 0 ? "text-red-500" : ""}`}
          >
            {votes}
          </span>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onVote("down")}>
            <ThumbsDown className={`w-4 h-4 ${votes < 0 ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>

        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 ml-1" onClick={onRemove}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}

"use client"

import { useState, memo } from "react"
import { Button } from "@/components/ui/button"
import { Shuffle, Repeat, Repeat1, Zap } from "lucide-react"

interface PlaylistControlsProps {
  onShuffle: () => void
  onRepeat: (mode: "off" | "all" | "one") => void
  totalTracks: number
  totalDuration: number
}

type RepeatMode = "off" | "all" | "one"

export const PlaylistControls = memo(function PlaylistControls({ onShuffle, onRepeat, totalTracks, totalDuration }: PlaylistControlsProps) {
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off")

  const handleRepeatClick = () => {
    const nextMode: RepeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off"
    setRepeatMode(nextMode)
    onRepeat(nextMode)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="glass p-4 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Playlist Controls</h3>
        <Zap className="w-4 h-4 text-purple-500" />
      </div>

      <div className="space-y-2">
        <Button size="sm" variant="outline" className="w-full justify-start gap-2 bg-transparent" onClick={onShuffle}>
          <Shuffle className="w-4 h-4" />
          <span>Shuffle Queue</span>
        </Button>

        <Button
          size="sm"
          variant={repeatMode !== "off" ? "default" : "outline"}
          className="w-full justify-start gap-2"
          onClick={handleRepeatClick}
        >
          {repeatMode === "one" ? (
            <>
              <Repeat1 className="w-4 h-4" />
              <span>Repeat One</span>
            </>
          ) : (
            <>
              <Repeat className="w-4 h-4" />
              <span>{repeatMode === "all" ? "Repeat All" : "Repeat Off"}</span>
            </>
          )}
        </Button>
      </div>

      <div className="pt-2 border-t border-border">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Tracks</span>
          <span>{totalTracks}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Duration</span>
          <span>{formatDuration(totalDuration)}</span>
        </div>
      </div>
    </div>
  )
})

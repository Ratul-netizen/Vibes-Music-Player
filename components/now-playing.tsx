"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/utils"

interface NowPlayingProps {
  track?: {
    title: string
    artist: string
    duration_seconds: number
  }
  onSkip: () => void
  onPlayNext: () => void
  duration?: number
}

export function NowPlaying({ track, onSkip, onPlayNext, duration = 300 }: NowPlayingProps) {
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(true)
  const [playStartTime, setPlayStartTime] = useState(Date.now())
  const totalDuration = track?.duration_seconds || 300

  useEffect(() => {
    if (!track || isPaused) return

    const startTime = playStartTime
    const durationMs = totalDuration * 1000

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = (elapsed / durationMs) * 100

      if (newProgress >= 100) {
        onPlayNext()
        setProgress(0)
        setPlayStartTime(Date.now())
      } else {
        setProgress(newProgress)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [track, isPaused, playStartTime, onPlayNext, totalDuration])

  useEffect(() => {
    setPlayStartTime(Date.now())
    setProgress(0)
    setIsPaused(true)
  }, [track?.title])

  if (!track) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="text-center text-muted-foreground">No track playing</div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
      <div className="space-y-3">
        <div>
          <p className="font-semibold text-foreground truncate">{track.title}</p>
          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
        </div>

        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(Math.floor((progress / 100) * totalDuration))}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>

        <div className="flex gap-2 justify-center">
          <Button size="sm" variant="outline" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? "▶ Play" : "⏸ Pause"}
          </Button>
          <Button size="sm" onClick={onSkip}>
            ⏭ Skip
          </Button>
        </div>
      </div>
    </Card>
  )
}

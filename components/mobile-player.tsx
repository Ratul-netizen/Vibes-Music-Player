"use client"

import type { Track } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { SkipBack, Play, Pause, SkipForward } from "lucide-react"
import { AlbumArtDisplay } from "@/components/album-art-display"
import { EqualizerVisualizer } from "@/components/equalizer-visualizer"

interface MobilePlayerProps {
  track?: Track
  isPlaying: boolean
  onPlayPause: () => void
  onSkipNext: () => void
  onSkipPrev: () => void
}

export function MobilePlayer({ track, isPlaying, onPlayPause, onSkipNext, onSkipPrev }: MobilePlayerProps) {
  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {track && (
        <>
          <AlbumArtDisplay artist={track.artist} album={track.album} isPlaying={isPlaying} />
          <EqualizerVisualizer isPlaying={isPlaying} />
          <div className="text-center">
            <h3 className="text-lg font-bold">{track.title}</h3>
            <p className="text-sm text-muted-foreground">{track.artist}</p>
            <p className="text-xs text-muted-foreground mt-1">{track.album}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button size="sm" variant="outline" onClick={onSkipPrev}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button size="lg" onClick={onPlayPause}>
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <Button size="sm" variant="outline" onClick={onSkipNext}>
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

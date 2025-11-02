"use client"

import { Zap, Music, Clock, TrendingUp } from "lucide-react"

interface PlaylistStatsProps {
  totalTracks: number
  averageRating: number
  mostVotedTrack: string | null
  totalDuration: number
}

export function PlaylistStats({ totalTracks, averageRating, mostVotedTrack, totalDuration }: PlaylistStatsProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const stats = [
    { icon: Music, label: "Tracks", value: totalTracks },
    { icon: Clock, label: "Duration", value: formatDuration(totalDuration) },
    { icon: TrendingUp, label: "Avg Rating", value: averageRating.toFixed(1) },
  ]

  return (
    <div className="glass p-4 rounded-lg space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-purple-500" />
        <h3 className="font-semibold text-sm">Playlist Stats</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <stat.icon className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
            <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
            <div className="text-sm font-semibold text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      {mostVotedTrack && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Most Popular</p>
          <p className="text-sm font-medium text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text truncate">
            {mostVotedTrack}
          </p>
        </div>
      )}
    </div>
  )
}

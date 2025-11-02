"use client"

import { Users, Radio, Music2 } from "lucide-react"
import { motion } from "framer-motion"
import { usePlayerStore } from "@/store/use-player-store"

interface PlaylistHeaderProps {
  playlistName: string
  connectedUsers: number
  isLive: boolean
}

export function PlaylistHeader({ playlistName, connectedUsers, isLive }: PlaylistHeaderProps) {
  const { isPlaying, currentTrack } = usePlayerStore()
  
  // Pulse animation synchronized with music
  const pulseAnimation = isPlaying && currentTrack 
    ? { scale: [1, 1.05, 1], transition: { duration: 1, repeat: Infinity, ease: "easeInOut" } }
    : { scale: 1 }

  return (
    <div className="flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-4">
        <motion.h1
          className="text-4xl font-extrabold flex items-center gap-2 bg-gradient-to-r from-purple-400 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent tracking-tight"
          animate={pulseAnimation}
        >
          <Music2 className="w-8 h-8 text-pink-400" />
          Vibes
        </motion.h1>
        <p className="text-sm text-muted-foreground hidden md:block">Collaborate • Play • Flow</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{connectedUsers} user{connectedUsers !== 1 ? "s" : ""}</span>
        </div>
        {isLive && (
          <div className="flex items-center gap-1 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-400">LIVE</span>
          </div>
        )}
      </div>
    </div>
  )
}

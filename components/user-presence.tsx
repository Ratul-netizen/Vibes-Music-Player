"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Circle, UserPlus, Volume2 } from "lucide-react"
import { motion } from "framer-motion"
import { usePlayerStore } from "@/store/use-player-store"

export interface User {
  id: string
  name: string
  avatar?: string
  status: "online" | "away" | "offline"
  lastSeen?: string
  isListening?: boolean
  lastAction?: string
}

interface UserPresenceProps {
  users: User[]
  currentUserId: string
}

export function UserPresence({ users, currentUserId }: UserPresenceProps) {
  const { currentTrack } = usePlayerStore()
  const onlineUsers = users.filter((u) => u.status === "online")
  const awayUsers = users.filter((u) => u.status === "away")
  const offlineUsers = users.filter((u) => u.status === "offline")
  
  // Check if multiple users are listening to the same track
  const listeningUsers = onlineUsers.filter((u) => u.isListening)
  const isListeningTogether = listeningUsers.length > 1 && currentTrack

  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-500",
  }

  const statusLabels = {
    online: "Online",
    away: "Away",
    offline: "Offline",
  }

  return (
    <Card className="glass p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Active Users</h3>
        <Badge variant="outline" className="text-xs">
          {onlineUsers.length} online
        </Badge>
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">ONLINE</p>
          {onlineUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 group relative"
            >
              <div className="relative w-8 h-8">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-bold text-white ring-2 ${
                    user.isListening ? "ring-purple-500 ring-offset-2 ring-offset-background animate-pulse" : "ring-green-500"
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {/* Status ring */}
                <Circle
                  className={`w-2.5 h-2.5 ${statusColors.online} fill-current absolute -bottom-0.5 -right-0.5 rounded-full`}
                />
                {/* Listening indicator */}
                {user.isListening && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute -top-1 -right-1"
                  >
                    <Volume2 className="w-3 h-3 text-purple-400" />
                  </motion.div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  {user.id === currentUserId && <span className="text-xs text-muted-foreground">(You)</span>}
                </div>
                {user.lastAction && (
                  <p className="text-xs text-muted-foreground truncate">{user.lastAction}</p>
                )}
              </div>
              {/* Tooltip on hover */}
              {user.lastAction && (
                <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {user.lastAction}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          {/* Listening together indicator */}
          {isListeningTogether && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 pt-2 border-t border-border"
            >
              <div className="flex items-center gap-1 text-xs text-purple-400">
                <Volume2 className="w-3 h-3" />
                <span className="font-medium">{listeningUsers.length} listening together</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Away Users */}
      {awayUsers.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground font-medium">AWAY</p>
          {awayUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2 opacity-60">
              <div className="relative w-8 h-8">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-bold text-white`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <Circle
                  className={`w-2.5 h-2.5 ${statusColors.away} fill-current absolute -bottom-0.5 -right-0.5 rounded-full`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {onlineUsers.length === 0 && awayUsers.length === 0 && offlineUsers.length > 0 && (
        <div className="flex items-center gap-2 justify-center py-2">
          <UserPlus className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Waiting for users...</p>
        </div>
      )}
    </Card>
  )
}

"use client"

import { Home, Music2, MessageCircle, Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { usePlayerStore } from "@/store/use-player-store"

interface MobileBottomNavProps {
  currentView: "library" | "now-playing" | "chat" | "settings"
  onViewChange: (view: "library" | "now-playing" | "chat" | "settings") => void
  showChat: boolean
  onCloseChat?: () => void
}

export function MobileBottomNav({
  currentView,
  onViewChange,
  showChat,
  onCloseChat,
}: MobileBottomNavProps) {
  const { currentTrack } = usePlayerStore()

  const navItems = [
    { id: "library" as const, icon: Home, label: "Library" },
    { id: "now-playing" as const, icon: Music2, label: "Now Playing", showBadge: !!currentTrack },
    { id: "chat" as const, icon: MessageCircle, label: "Chat" },
    { id: "settings" as const, icon: Settings, label: "Settings" },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-2xl lg:hidden"
      >
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id || (item.id === "chat" && showChat)

            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  if (item.id === "chat" && showChat && onCloseChat) {
                    onCloseChat()
                  } else {
                    onViewChange(item.id)
                  }
                }}
                className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
                  isActive ? "text-purple-400 bg-purple-500/10" : "text-muted-foreground hover:text-foreground"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.showBadge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-background"
                    />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobileNavIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-purple-500 rounded-full"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}


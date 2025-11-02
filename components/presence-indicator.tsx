"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

interface PresenceIndicatorProps {
  isLive: boolean
  userCount: number
  updateFrequency?: number
}

export function PresenceIndicator({ isLive, userCount, updateFrequency = 3000 }: PresenceIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      setIsVisible((v) => !v)
    }, updateFrequency)

    return () => clearInterval(interval)
  }, [isLive, updateFrequency])

  if (!isLive) {
    return (
      <Badge variant="outline" className="text-xs">
        Offline
      </Badge>
    )
  }

  return (
    <Badge variant="default" className={`text-xs gap-1 transition-opacity ${isVisible ? "opacity-100" : "opacity-50"}`}>
      <Activity className="w-3 h-3" />
      {userCount} listening
    </Badge>
  )
}

"use client"

import { useEffect, useState } from "react"

interface EqualizerVisualizerProps {
  isPlaying: boolean
  className?: string
}

export function EqualizerVisualizer({ isPlaying, className = "" }: EqualizerVisualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(8).fill(0))

  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(8).fill(0))
      return
    }

    const interval = setInterval(() => {
      setBars(
        Array(8)
          .fill(0)
          .map(() => Math.random() * 100),
      )
    }, 150)

    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <div className={`flex items-end justify-center gap-1 h-12 ${className}`}>
      {bars.map((height, idx) => (
        <div
          key={idx}
          className="w-2 bg-gradient-to-t from-neon-cyan via-neon-purple to-neon-pink rounded-full transition-all duration-150"
          style={{
            height: `${height}%`,
            minHeight: "4px",
            boxShadow: isPlaying ? "0 0 8px rgba(0, 255, 255, 0.5)" : "none",
          }}
        />
      ))}
    </div>
  )
}

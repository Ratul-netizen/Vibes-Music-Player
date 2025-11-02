"use client"

import { useEffect, useState } from "react"
import { extractDominantColor } from "@/lib/color-extractor"
import { usePlayerStore } from "@/store/use-player-store"
import { ParticleBackground } from "@/components/particle-background"

export function MusicBanner() {
  const { currentTrack } = usePlayerStore()
  const track = currentTrack
  const [dominantColor, setDominantColor] = useState<string>("#9333ea")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const coverUrl = track?.cover_url || track?.coverUrl
    if (coverUrl) {
      setIsLoading(true)
      extractDominantColor(coverUrl)
        .then((color) => {
          setDominantColor(color)
          setIsLoading(false)
        })
        .catch(() => {
          setDominantColor("#9333ea")
          setIsLoading(false)
        })
    } else {
      setDominantColor("#9333ea")
      setIsLoading(false)
    }
  }, [track?.cover_url, track?.coverUrl])

  if (!track) {
    return null
  }

  const coverUrl = track.cover_url || track.coverUrl || "/placeholder.svg"

  return (
    <div
      className="relative w-full h-64 md:h-80 rounded-2xl mb-6 overflow-hidden group"
      style={{
        boxShadow: `0 0 60px ${dominantColor}40, 0 0 120px ${dominantColor}20`,
        transition: "box-shadow 0.6s ease",
      }}
    >
      {/* Particle Background */}
      <ParticleBackground />
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{
          backgroundImage: `url(${coverUrl})`,
          filter: "blur(20px) brightness(0.4)",
          transform: "scale(1.1)",
        }}
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"
        style={{
          background: `linear-gradient(to top, ${dominantColor}80 0%, ${dominantColor}40 50%, transparent 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 md:p-10">
        <div className="flex items-end gap-6">
          {/* Album Art */}
          <div
            className="relative flex-shrink-0 rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20"
            style={{
              width: "160px",
              height: "160px",
            }}
          >
            <img
              src={coverUrl}
              alt={`${track.album} cover`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg"
              }}
            />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(135deg, ${dominantColor}40, transparent)`,
              }}
            />
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <p className="text-sm font-medium text-white/80 mb-1">Now Playing</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 truncate">{track.title}</h2>
              <p className="text-lg text-white/80 truncate">{track.artist}</p>
              <p className="text-sm text-white/60 mt-1">{track.album}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Glow Effect */}
      {!isLoading && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: `radial-gradient(circle at center, ${dominantColor} 0%, transparent 70%)`,
            animation: "pulse-glow 3s ease-in-out infinite",
          }}
        />
      )}
    </div>
  )
}




"use client"

interface AlbumArtDisplayProps {
  artist: string
  album: string
  isPlaying: boolean
}

export function AlbumArtDisplay({ artist, album, isPlaying }: AlbumArtDisplayProps) {
  const initials = artist
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={`relative w-48 h-48 rounded-lg overflow-hidden ${isPlaying ? "animate-spin-slow" : ""}`}
      style={{
        animationDuration: isPlaying ? "8s" : "0s",
      }}
    >
      <div className="w-full h-full bg-gradient-to-br from-neon-purple via-neon-pink to-neon-cyan flex items-center justify-center relative group">
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
          <div className="text-6xl font-bold text-white/80">{initials}</div>
          <div className="text-sm text-white/60 mt-2 text-center px-4">
            <p>{artist}</p>
            <p className="text-xs mt-1">{album}</p>
          </div>
        </div>

        {isPlaying && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        )}
      </div>

      <div className="absolute inset-0 ring-4 ring-neon-purple ring-opacity-50 rounded-lg pointer-events-none" />
    </div>
  )
}

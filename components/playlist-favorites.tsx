"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Trash2 } from "lucide-react"

interface FavoritedTrack {
  id: string
  track_id: string
  track: {
    title: string
    artist: string
  }
}

interface PlaylistFavoritesProps {
  favorites: FavoritedTrack[]
  onAddFavorite: (track: FavoritedTrack) => void
  onRemoveFavorite: (id: string) => void
}

export function PlaylistFavorites({ favorites, onRemoveFavorite }: PlaylistFavoritesProps) {
  if (favorites.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No favorites yet. Heart a track to add it here.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">❤️ Favorite Tracks</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {favorites.map((track) => (
          <Card key={track.id} className="p-2 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{track.track.title}</p>
              <p className="text-xs text-muted-foreground truncate">{track.track.artist}</p>
            </div>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onRemoveFavorite(track.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

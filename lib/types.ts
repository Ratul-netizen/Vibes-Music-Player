"use client"

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration_seconds: number
  genre: string
}

export interface PlaylistItem {
  id: string
  track_id: string
  track: Track
  position: number
  votes: number
  added_by: string
  added_at: string
  is_playing: boolean
  is_favorite?: boolean
}

export interface User {
  id: string
  name: string
  status: "online" | "away" | "offline"
  avatar: string
}

export interface UserSettings {
  theme: string
  volume: number
  autoPlay: boolean
  notifications: boolean
  highContrast: boolean
  compactMode: boolean
  animationsEnabled: boolean
}

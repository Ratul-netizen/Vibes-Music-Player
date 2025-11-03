import { create } from "zustand"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration_seconds: number
  genre: string
  category?: string
  audioUrl?: string
  coverUrl?: string
  lyrics?: string
  duration?: string
  cover_url?: string
}

export interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  progress: number
  setTrack: (track: Track | null) => void
  togglePlay: () => void
  setIsPlaying: (playing: boolean) => void
  setProgress: (progress: number) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  setTrack: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setProgress: (progress) => set({ progress }),
}))


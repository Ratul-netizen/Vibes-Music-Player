/**
 * Database Seeding Module
 *
 * Populates the tracks table with sample music data for development and testing.
 * Only seeds if the tracks table is empty to prevent duplicates.
 *
 * Sample Data Includes:
 * - 30+ tracks across multiple genres
 * - Mix of popular artists and indie artists
 * - Various album names and durations
 *
 * @function seedDatabase - Populate database with sample tracks if empty
 */

import { getDb, type Track } from "./db"
import { randomUUID } from "crypto"

const TRACKS: Omit<Track, "id">[] = [
  { title: "Bohemian Rhapsody", artist: "Queen", album: "A Night at the Opera", duration_seconds: 355, genre: "Rock" },
  {
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    album: "Led Zeppelin IV",
    duration_seconds: 482,
    genre: "Rock",
  },
  { title: "Imagine", artist: "John Lennon", album: "Imagine", duration_seconds: 183, genre: "Pop" },
  { title: "Hotel California", artist: "Eagles", album: "Hotel California", duration_seconds: 391, genre: "Rock" },
  { title: "Purple Haze", artist: "Jimi Hendrix", album: "Are You Experienced", duration_seconds: 173, genre: "Rock" },
  { title: "Smells Like Teen Spirit", artist: "Nirvana", album: "Nevermind", duration_seconds: 301, genre: "Grunge" },
  {
    title: "Like a Rolling Stone",
    artist: "Bob Dylan",
    album: "Highway 61 Revisited",
    duration_seconds: 369,
    genre: "Rock",
  },
  { title: "Hey Jude", artist: "The Beatles", album: "Hey Jude", duration_seconds: 427, genre: "Pop" },
  { title: "Comfortably Numb", artist: "Pink Floyd", album: "The Wall", duration_seconds: 385, genre: "Rock" },
  {
    title: "Moonlight Sonata",
    artist: "Ludwig van Beethoven",
    album: "Piano Sonata No. 14",
    duration_seconds: 475,
    genre: "Classical",
  },
  { title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration_seconds: 200, genre: "Electronic" },
  { title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", duration_seconds: 203, genre: "Pop" },
  { title: "As It Was", artist: "Harry Styles", album: "Harry's House", duration_seconds: 172, genre: "Pop" },
  { title: "Midnight Rain", artist: "Taylor Swift", album: "Midnights", duration_seconds: 176, genre: "Pop" },
  { title: "Dance the Night", artist: "Dua Lipa", album: "Barbie The Album", duration_seconds: 204, genre: "Pop" },
  { title: "Good as Hell", artist: "Lizzo", album: "Cuz I Love You", duration_seconds: 170, genre: "Pop" },
  { title: "Anti-Hero", artist: "Taylor Swift", album: "Midnights", duration_seconds: 200, genre: "Pop" },
  { title: "Running Up That Hill", artist: "Kate Bush", album: "Hounds of Love", duration_seconds: 305, genre: "Pop" },
  { title: "Thunderstruck", artist: "AC/DC", album: "The Razors Edge", duration_seconds: 292, genre: "Rock" },
  {
    title: "Enter Sandman",
    artist: "Metallica",
    album: "...And Justice for All",
    duration_seconds: 327,
    genre: "Metal",
  },
  { title: "Black Sabbath", artist: "Black Sabbath", album: "Black Sabbath", duration_seconds: 382, genre: "Metal" },
  { title: "One", artist: "Metallica", album: "...And Justice for All", duration_seconds: 447, genre: "Metal" },
  { title: "Paranoid Android", artist: "Radiohead", album: "OK Computer", duration_seconds: 391, genre: "Alternative" },
  { title: "Pyramid Song", artist: "Radiohead", album: "Kid A", duration_seconds: 314, genre: "Alternative" },
  { title: "Creep", artist: "Radiohead", album: "Pablo Honey", duration_seconds: 239, genre: "Alternative" },
  {
    title: "Wonderwall",
    artist: "Oasis",
    album: "(What's the Story) Morning Glory?",
    duration_seconds: 258,
    genre: "Rock",
  },
  {
    title: "Don't Look Back in Anger",
    artist: "Oasis",
    album: "(What's the Story) Morning Glory?",
    duration_seconds: 285,
    genre: "Rock",
  },
  { title: "Bitter Sweet Symphony", artist: "The Verve", album: "Urban Hymns", duration_seconds: 319, genre: "Rock" },
  {
    title: "Champagne Supernova",
    artist: "Oasis",
    album: "(What's the Story) Morning Glory?",
    duration_seconds: 284,
    genre: "Rock",
  },
  { title: "Wonderland", artist: "Taylor Swift", album: "1989", duration_seconds: 176, genre: "Pop" },
  { title: "Shake It Off", artist: "Taylor Swift", album: "1989", duration_seconds: 219, genre: "Pop" },
  { title: "Death By A Thousand Cuts", artist: "Taylor Swift", album: "Lover", duration_seconds: 208, genre: "Pop" },
  { title: "Lover", artist: "Taylor Swift", album: "Lover", duration_seconds: 300, genre: "Pop" },
  { title: "Lavender Haze", artist: "Taylor Swift", album: "Midnights", duration_seconds: 218, genre: "Pop" },
]

export function seedDatabase() {
  const db = getDb()

  // Check if already seeded
  const count = db.prepare("SELECT COUNT(*) as count FROM tracks").get() as { count: number }
  if (count.count > 0) return

  // Insert tracks
  const insertTrack = db.prepare(
    "INSERT INTO tracks (id, title, artist, album, duration_seconds, genre) VALUES (?, ?, ?, ?, ?, ?)",
  )

  const trackIds = TRACKS.map((track) => {
    const id = `track-${randomUUID()}`
    insertTrack.run(id, track.title, track.artist, track.album, track.duration_seconds, track.genre)
    return id
  })

  // Insert initial playlist
  const insertPlaylistTrack = db.prepare(
    "INSERT INTO playlist_tracks (id, track_id, position, votes, added_by, added_at, is_playing) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )

  const now = new Date().toISOString()
  const selectedTracks = trackIds.slice(0, 8)

  selectedTracks.forEach((trackId, index) => {
    const playlistId = `playlist-${randomUUID()}`
    const isPlaying = index === 0 ? 1 : 0
    const votes = Math.floor(Math.random() * 10) - 2

    insertPlaylistTrack.run(playlistId, trackId, index + 1, votes, "Demo", now, isPlaying)
  })
}

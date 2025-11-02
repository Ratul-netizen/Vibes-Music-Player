/**
 * Database Module
 *
 * Initializes and manages SQLite database connections for the playlist application.
 * Handles both tracks and playlist_tracks tables with schema management.
 *
 * @module
 *
 * @function initDb - Initialize database schema if needed
 * @function getDb - Get singleton database connection
 *
 * Tables:
 * - tracks: Available songs library
 * - playlist_tracks: Current playlist items with position, votes, metadata
 */

import Database from "better-sqlite3"
import { join } from "path"
import { fileURLToPath } from "url"

const __dirname = join(fileURLToPath(import.meta.url), "..")
// Use environment variable for database path in Docker, otherwise use project root
const dbDir = process.env.DB_PATH || join(__dirname, "..")
const dbPath = join(dbDir, "playlist.db")

let db: Database.Database | null = null

export function getDb() {
  if (!db) {
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
  }
  return db
}

export function initDb() {
  const database = getDb()

  // Create tables
  database.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      genre TEXT NOT NULL,
      cover_url TEXT
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      id TEXT PRIMARY KEY,
      track_id TEXT NOT NULL,
      position REAL NOT NULL,
      votes INTEGER DEFAULT 0,
      added_by TEXT DEFAULT 'Anonymous',
      added_at TEXT NOT NULL,
      is_playing INTEGER DEFAULT 0,
      played_at TEXT,
      FOREIGN KEY (track_id) REFERENCES tracks(id),
      UNIQUE(track_id)
    );

    CREATE INDEX IF NOT EXISTS idx_playlist_position ON playlist_tracks(position);
    CREATE INDEX IF NOT EXISTS idx_playlist_playing ON playlist_tracks(is_playing);
  `)

  return database
}

export type Track = {
  id: string
  title: string
  artist: string
  album: string
  duration_seconds: number
  genre: string
  cover_url?: string
}

export type PlaylistTrack = {
  id: string
  track_id: string
  position: number
  votes: number
  added_by: string
  added_at: string
  is_playing: boolean
  played_at?: string
}

export type PlaylistItem = PlaylistTrack & {
  track: Track
}

/**
 * Event Broadcasting Module
 *
 * Manages event broadcasting for real-time synchronization across connected clients.
 * Currently uses in-memory event emitter (upgradeable to WebSocket/SSE).
 *
 * Event Types:
 * - track.added: New track added to playlist
 * - track.removed: Track removed from playlist
 * - track.voted: Track received a vote
 * - track.moved: Track position changed
 * - track.playing: Track set as currently playing
 *
 * @function broadcastEvent - Emit an event for all listeners
 */

export type PlaylistEvent =
  | { type: "track.added"; item: any }
  | { type: "track.removed"; id: string }
  | { type: "track.moved"; item: any }
  | { type: "track.voted"; item: any }
  | { type: "track.playing"; id: string }
  | { type: "playlist.reordered"; items: any[] }
  | { type: "ping"; ts: string }

type EventListener = (event: PlaylistEvent) => void

const listeners = new Set<EventListener>()

export function addEventListener(listener: EventListener) {
  listeners.add(listener)
}

export function removeEventListener(listener: EventListener) {
  listeners.delete(listener)
}

export function broadcastEvent(event: PlaylistEvent) {
  listeners.forEach((listener) => listener(event))
}

export function getListeners() {
  return listeners
}

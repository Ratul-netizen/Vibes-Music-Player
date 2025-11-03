# Collaborative Playlist Manager

A real-time collaborative playlist application where multiple users can add, remove, reorder, and vote on songs in a shared playlist. All changes synchronize instantly across browser windows.

## Features

- **Shared Playlist**: Add and manage tracks collaboratively
- **Drag & Drop Reordering**: Smooth drag-and-drop interface for reordering tracks
- **Voting System**: Upvote/downvote tracks to affect their priority
- **Now Playing**: Visual indicator and simulated playback with progress bar
- **Real-time Sync**: Changes propagate instantly across all connected clients
- **Track Library**: Searchable library with genre filtering

## Technical Stack

- **Frontend**: Next.js 16 + React + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with better-sqlite3
- **State Management**: SWR for data fetching and synchronization
- **Realtime**: WebSocket (Socket.IO) with heartbeat + client reconnection

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm (for local development)
- Docker and Docker Compose (for Docker deployment)

### Installation

#### Option 1: Docker (Recommended)

1. Clone the repository
2. Build and run with Docker Compose:
\`\`\`bash
docker-compose up --build
\`\`\`

The application will be available at `http://localhost:3000`.

Realtime WebSocket server: `ws://localhost:4000`

Prisma Studio (visual DB viewer): `http://localhost:5555` (auto-started as a sidecar)

The database file will be persisted in `./data/playlist.db`.

**Docker Commands:**
- Start containers: `docker-compose up`
- Start in background: `docker-compose up -d`
- Stop containers: `docker-compose down`
- View logs: `docker-compose logs -f`
- Rebuild: `docker-compose up --build`

#### Option 2: Local Development

1. Clone the repository
2. Install dependencies:
\`\`\`bash
npm install
# or if using pnpm
pnpm install
\`\`\`

3. Initialize the database:
\`\`\`bash
npm run db:init
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The application will be available at `http://localhost:3000`.

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   └── playlist/        # API endpoints for playlist operations
│   ├── page.tsx             # Main application page
│   └── layout.tsx           # Root layout
├── components/
│   ├── playlist-track.tsx    # Individual track component
│   ├── track-library.tsx     # Track library sidebar
│   ├── now-playing.tsx       # Now playing display
│   └── ui/                   # Shadcn UI components
├── lib/
│   ├── db.ts                # Database initialization
│   ├── seed.ts              # Database seeding
│   ├── position.ts          # Position calculation algorithm
│   ├── events.ts            # Event broadcasting system
│   └── utils.ts             # Utility functions
└── scripts/
    └── test.ts              # Test runner
\`\`\`

## API Reference

### GET /api/tracks
Retrieve all available tracks from the library.

**Response**: Array of Track objects

### GET /api/playlist
Retrieve the current playlist with all tracks ordered by position.

**Response**: Array of PlaylistItem objects

### POST /api/playlist
Add a track to the playlist.

**Body**:
\`\`\`json
{
  "track_id": "track-123",
  "added_by": "User123"
}
\`\`\`

**Response**: 201 Created with the new PlaylistItem

### PATCH /api/playlist/{id}
Update a track's position or playing status.

**Body**:
\`\`\`json
{
  "position": 2.5,
  "is_playing": true
}
\`\`\`

**Response**: 200 OK with updated PlaylistItem

### POST /api/playlist/{id}/vote
Vote on a track (upvote or downvote).

**Body**:
\`\`\`json
{
  "direction": "up"
}
\`\`\`

**Response**: 200 OK with updated vote count

### DELETE /api/playlist/{id}
Remove a track from the playlist.

**Response**: 204 No Content

## Position Algorithm

The application uses a fractional position algorithm for drag-and-drop reordering, allowing unlimited insertions without database reindexing:

\`\`\`typescript
function calculatePosition(prevPosition, nextPosition) {
  if (!prevPosition && !nextPosition) return 1.0;
  if (!prevPosition) return nextPosition - 1;
  if (!nextPosition) return prevPosition + 1;
  return (prevPosition + nextPosition) / 2;
}
\`\`\`

### Example

Initial playlist: [1.0, 2.0, 3.0]
Insert between 1.0 and 2.0: [1.0, 1.5, 2.0, 3.0]
Insert between 1.0 and 1.5: [1.0, 1.25, 1.5, 2.0, 3.0]

## Database Schema

### tracks
- `id` (TEXT, PRIMARY KEY): Unique track identifier
- `title` (TEXT): Track name
- `artist` (TEXT): Artist name
- `album` (TEXT): Album name
- `duration_seconds` (INTEGER): Duration in seconds
- `genre` (TEXT): Genre classification
- `cover_url` (TEXT, OPTIONAL): Cover image URL

### playlist_tracks
- `id` (TEXT, PRIMARY KEY): Unique playlist item identifier
- `track_id` (FOREIGN KEY): Reference to tracks table
- `position` (REAL): Position for ordering (supports fractional values)
- `votes` (INTEGER): Vote count (-∞ to +∞)
- `added_by` (TEXT): User who added the track
- `added_at` (TEXT): Timestamp when added
- `is_playing` (INTEGER): Boolean flag (0 or 1)
- `played_at` (TEXT, NULLABLE): When the track was played

## Features Implemented

- ✓ Add/remove tracks from playlist
- ✓ Drag-and-drop reordering with fractional positions
- ✓ Voting system (upvote/downvote)
- ✓ Now Playing indicator with simulated playback
- ✓ Real-time synchronization (polling-based)
- ✓ Track library with search and genre filtering
- ✓ Responsive UI with Tailwind CSS
- ✓ Position algorithm with comprehensive tests
- ✓ Error handling and user feedback

## Bonus Features

- Smooth animations on drag-drop and voting
- Gradient design for now playing indicator
- Connected clients sync automatically
- Track duration display
- Vote count visualization with color coding

## Technical Decisions

### Database Choice
SQLite with better-sqlite3 was chosen for its simplicity and ability to run in development without external services. The data persists in a local file and is suitable for the assignment scope.

### Position Algorithm
Rather than storing position as an integer index (which would require reindexing on every move), we use fractional positions that can be halved infinitely. This scales to any number of drag operations without O(n) reindexing.

### Realtime Sync
The current implementation uses SWR with polling (500ms interval) for simplicity. In production, this would upgrade to WebSocket for true real-time bidirectional updates with lower latency.

### State Management
SWR handles client-side caching and automatic synchronization. Server state is the source of truth, ensuring consistency even with stale client state.

## If I Had 2 More Days...

### Performance Optimizations
- Implement WebSocket for true real-time sync instead of polling
- Add database connection pooling
- Optimize queries with proper indexing on (position, is_playing)
- Implement viewport-based virtual scrolling for 200+ tracks

### User Experience
- Persistent user sessions with localStorage
- Undo/redo functionality using event log
- Multi-playlist support for different rooms/sessions
- Auto-sort playlist by votes (optional toggle)
- Keyboard shortcuts (space to play/pause, arrows for navigation)

### Advanced Features
- User presence indicators showing who's online
- Track history and recently played
- Duplicate track prevention with visual indicators
- Export/import playlist as JSON or M3U
- Analytics dashboard showing voting patterns

### Testing
- End-to-end tests with Playwright for multi-window sync verification
- Integration tests for API endpoints
- Load testing with 100+ concurrent connections
- Performance benchmarks for drag-drop with 200+ tracks

### Deployment
- Docker containerization for easy deployment
- CI/CD pipeline with GitHub Actions
- Database migration system for production
- Rate limiting on API endpoints
- CORS configuration for multi-origin access

## Running Tests

\`\`\`bash
npm test
\`\`\`

Includes unit tests for the position algorithm with dense insertion edge cases.

## Demo / Multi-window Sync

Open two browser windows side by side and perform:
- Add a track from the library → appears in both windows within ~1s
- Vote on a track → counts update in both windows
- Reorder by dragging → order updates in both windows
- Set Now Playing → the player bubble updates across windows

## Architecture Overview

- Next.js App Router for UI + API Routes for simple endpoints
- Socket.IO Node server (server.js) for realtime events
  - Broadcasts: `track:added`, `track:removed`, `track:reordered`, `track:voted`, `track:playing`
  - Heartbeat: emits `{ type: "ping", ts }` every 15s
- Client emits the same events after local optimistic updates
- Fractional-position ordering stored in memory (or DB when enabled)

## Trade-offs & Decisions

- Chose a lightweight Socket.IO server to simplify local demo instead of a full REST+WS backend
- Optimistic UI first; server authoritative on refresh
- Position stored as fractional numbers for O(1) reorder, avoiding reindexing
- Minimal test suite focused on algorithm correctness given time constraints

## If I Had 2 More Days (delta)

- Add API-backed playlist persistence with Prisma models (PlaylistTrack)
- Broadcast from server after DB writes (source-of-truth on server)
- Integration tests for realtime events; Playwright E2E for multi-window behavior
- Virtualized list for 200+ items; throttle reorder messages

## Troubleshooting

### Database Issues
If you encounter database lock errors, delete `playlist.db` and restart:
\`\`\`bash
rm playlist.db
npm run dev
\`\`\`

### Connection Issues
Clear browser cache and refresh the page. The application will resync with the server.

### Drag-Drop Not Working
Ensure JavaScript is enabled and try a different browser. Some older browsers may have limitations with the Drag and Drop API.

## License

MIT

## Author

Created as a take-home assignment for evaluating full-stack development skills.
# Vibes-Music-Player

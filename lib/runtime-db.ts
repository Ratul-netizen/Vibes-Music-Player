import { existsSync, mkdirSync, copyFileSync } from "fs"
import { dirname, join } from "path"

// Copy the bundled SQLite DB from /var/task (code bundle) into /tmp so it is writable at runtime
export function ensureWritableSqliteDb() {
  const targetPath = "/tmp/playlist.db"
  if (existsSync(targetPath)) return targetPath

  // bundled path relative to project root
  const bundledPath = join(process.cwd(), "data", "playlist.db")
  try {
    const dir = dirname(targetPath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    if (existsSync(bundledPath)) {
      copyFileSync(bundledPath, targetPath)
    }
  } catch {}
  return targetPath
}


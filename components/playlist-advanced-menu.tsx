"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DownloadCloud, Filter, SortAsc, Keyboard, Copy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface PlaylistItem {
  id: string
  track_id: string
  track: {
    title: string
    artist: string
    duration_seconds: number
  }
  votes: number
  added_by: string
}

interface PlaylistAdvancedMenuProps {
  playlist: PlaylistItem[]
  onSortChange: (sortBy: "position" | "votes" | "date-added" | "title") => void
  onExportPlaylist: () => void
}

export function PlaylistAdvancedMenu({ playlist, onSortChange, onExportPlaylist }: PlaylistAdvancedMenuProps) {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Sort Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
            <SortAsc className="w-4 h-4" />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Sort Queue By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSortChange("position")}>Position (Default)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("votes")}>Most Voted</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("date-added")}>Recently Added</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("title")}>Track Title (A-Z)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
            <DownloadCloud className="w-4 h-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Export Playlist</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExportPlaylist}>
            <Copy className="w-4 h-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => alert("Export as M3U coming soon")}>Download M3U Playlist</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Keyboard Shortcuts Help */}
      <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
            <Keyboard className="w-4 h-4" />
            Shortcuts
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Quick keyboard controls to manage your playlist</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Space</span>
                <kbd className="px-2 py-1 text-sm border rounded bg-muted">Play / Pause</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">→</span>
                <kbd className="px-2 py-1 text-sm border rounded bg-muted">Next Track</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">← </span>
                <kbd className="px-2 py-1 text-sm border rounded bg-muted">Previous Track</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Ctrl + S</span>
                <kbd className="px-2 py-1 text-sm border rounded bg-muted">Export Playlist</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Ctrl + /</span>
                <kbd className="px-2 py-1 text-sm border rounded bg-muted">Toggle Shuffle</kbd>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Playlist Info */}
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Info
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Queue Statistics</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Tracks</p>
                <p className="text-2xl font-bold">{playlist.length}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Votes</p>
                <p className="text-2xl font-bold">{playlist.reduce((sum, item) => sum + item.votes, 0)}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Avg Rating</p>
                <p className="text-2xl font-bold">
                  {playlist.length > 0
                    ? (playlist.reduce((sum, item) => sum + item.votes, 0) / playlist.length).toFixed(1)
                    : 0}
                </p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Top Voted</p>
                <p className="text-sm font-bold truncate">
                  {playlist.length > 0 ? Math.max(...playlist.map((p) => p.votes)) : 0}
                </p>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

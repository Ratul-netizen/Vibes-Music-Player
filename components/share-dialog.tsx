"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ShareDialogProps {
  playlistName: string
  trackCount: number
}

export function ShareDialog({ playlistName, trackCount }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  const shareLink = typeof window !== "undefined" ? window.location.href : ""
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareLink)}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `${playlistName}-qr.png`
    link.click()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 bg-transparent">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle>Share Playlist</DialogTitle>
          <DialogDescription>
            {playlistName} • {trackCount} tracks
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <img
              src={qrCodeUrl || "/placeholder.svg"}
              alt="Playlist QR Code"
              className="w-48 h-48 rounded-lg p-2 bg-white"
            />
            <p className="text-sm text-muted-foreground">Scan to share</p>
            <Button size="sm" variant="outline" onClick={handleDownloadQR} className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Download QR
            </Button>
          </div>

          {/* Share Link */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex gap-2">
              <input type="text" value={shareLink} readOnly className="flex-1 px-3 py-2 rounded-md bg-muted text-sm" />
              <Button size="sm" onClick={handleCopyLink} className="gap-2">
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Share Text */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Share Message</label>
            <textarea
              defaultValue={`Check out my playlist "${playlistName}" with ${trackCount} tracks! 🎵`}
              className="p-2 rounded-md bg-muted text-sm resize-none"
              rows={3}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ThemeSelector } from "@/components/theme-selector"
import { Settings, Volume2, Eye, Bell, Zap } from "lucide-react"

export interface UserSettings {
  theme: string
  volume: number
  autoPlay: boolean
  notifications: boolean
  highContrast: boolean
  compactMode: boolean
  animationsEnabled: boolean
}

interface SettingsPanelProps {
  settings: UserSettings
  onSettingsChange: (settings: UserSettings) => void
}

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const handleThemeChange = (theme: string) => {
    onSettingsChange({ ...settings, theme })
  }

  const handleToggle = (key: keyof UserSettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    })
  }

  const handleVolumeChange = (volume: number[]) => {
    onSettingsChange({ ...settings, volume: volume[0] })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 bg-transparent">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your playlist experience</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Section */}
          <div>
            <ThemeSelector currentTheme={settings.theme} onThemeChange={handleThemeChange} />
          </div>

          {/* Playback Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              Playback
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoplay" className="text-sm">
                  Auto-play next track
                </Label>
                <Switch id="autoplay" checked={settings.autoPlay} onCheckedChange={() => handleToggle("autoPlay")} />
              </div>
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">Volume</Label>
              </div>
              <Slider
                value={[settings.volume]}
                onValueChange={handleVolumeChange}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{settings.volume}%</p>
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-500" />
              Display
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="contrast" className="text-sm">
                  High contrast mode
                </Label>
                <Switch
                  id="contrast"
                  checked={settings.highContrast}
                  onCheckedChange={() => handleToggle("highContrast")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="compact" className="text-sm">
                  Compact mode
                </Label>
                <Switch
                  id="compact"
                  checked={settings.compactMode}
                  onCheckedChange={() => handleToggle("compactMode")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="animations" className="text-sm">
                  Enable animations
                </Label>
                <Switch
                  id="animations"
                  checked={settings.animationsEnabled}
                  onCheckedChange={() => handleToggle("animationsEnabled")}
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-500" />
              Notifications
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-sm">
                  Enable notifications
                </Label>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={() => handleToggle("notifications")}
                />
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="pt-2 border-t border-border">
            <Card className="p-3 bg-muted text-sm">
              <p className="font-semibold mb-1">Playlist App v1.0</p>
              <p className="text-xs text-muted-foreground">
                Collaborative music sharing experience with real-time chat and theme customization.
              </p>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

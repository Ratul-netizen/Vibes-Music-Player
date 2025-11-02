"use client"
import { Card } from "@/components/ui/card"
import { Palette, Check } from "lucide-react"

export interface Theme {
  id: string
  name: string
  label: string
  colors: {
    primary: string
    secondary: string
    accent: string
    gradient: [string, string, string]
  }
}

const THEMES: Theme[] = [
  {
    id: "neon-pulse",
    name: "theme-neon-pulse",
    label: "Neon Pulse",
    colors: {
      primary: "#a78bfa",
      secondary: "#06b6d4",
      accent: "#ec4899",
      gradient: ["#9333ea", "#14b8a6", "#ec4899"],
    },
  },
  {
    id: "neon-nights",
    name: "theme-neon-nights",
    label: "Neon Nights",
    colors: {
      primary: "#8b5cf6",
      secondary: "#a855f7",
      accent: "#ec4899",
      gradient: ["#6366f1", "#8b5cf6", "#ec4899"],
    },
  },
  {
    id: "midnight-drive",
    name: "theme-midnight-drive",
    label: "Midnight Drive",
    colors: {
      primary: "#4338ca",
      secondary: "#6366f1",
      accent: "#818cf8",
      gradient: ["#1e1b4b", "#4338ca", "#6366f1"],
    },
  },
  {
    id: "aurora",
    name: "theme-aurora",
    label: "Aurora",
    colors: {
      primary: "#06b6d4",
      secondary: "#10b981",
      accent: "#8b5cf6",
      gradient: ["#0891b2", "#06b6d4", "#10b981"],
    },
  },
  {
    id: "cyber-sunset",
    name: "theme-cyber-sunset",
    label: "Cyber Sunset",
    colors: {
      primary: "#f97316",
      secondary: "#f59e0b",
      accent: "#ec4899",
      gradient: ["#f97316", "#f59e0b", "#ec4899"],
    },
  },
  {
    id: "deep-space",
    name: "theme-deep-space",
    label: "Deep Space",
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#ec4899",
      gradient: ["#1e293b", "#6366f1", "#8b5cf6"],
    },
  },
  {
    id: "sunset",
    name: "theme-sunset",
    label: "Sunset",
    colors: {
      primary: "#f97316",
      secondary: "#f472b6",
      accent: "#fbbf24",
      gradient: ["#f97316", "#f472b6", "#fbbf24"],
    },
  },
  {
    id: "arctic",
    name: "theme-arctic",
    label: "Arctic",
    colors: {
      primary: "#0ea5e9",
      secondary: "#06b6d4",
      accent: "#8dd3fc",
      gradient: ["#0ea5e9", "#06b6d4", "#8dd3fc"],
    },
  },
  {
    id: "vintage",
    name: "theme-vintage",
    label: "Vintage",
    colors: {
      primary: "#d97706",
      secondary: "#b45309",
      accent: "#f59e0b",
      gradient: ["#d97706", "#b45309", "#f59e0b"],
    },
  },
  {
    id: "minimal",
    name: "theme-minimal",
    label: "Minimal",
    colors: {
      primary: "#ffffff",
      secondary: "#d1d5db",
      accent: "#6b7280",
      gradient: ["#ffffff", "#d1d5db", "#6b7280"],
    },
  },
]

interface ThemeSelectorProps {
  currentTheme: string
  onThemeChange: (themeId: string) => void
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4 text-purple-500" />
        <h3 className="font-semibold text-sm">Theme</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
        {THEMES.map((theme) => {
          const isSelected = currentTheme === theme.id
          const bgColor = theme.colors.primary

          return (
            <button key={theme.id} onClick={() => onThemeChange(theme.id)} className="relative group">
              <Card
                className={`p-3 cursor-pointer transition-all ${
                  isSelected ? "ring-2 ring-offset-1 ring-offset-background" : "hover:border-opacity-100"
                }`}
                style={{
                  borderColor: isSelected ? bgColor : undefined,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: theme.colors.gradient.join(", "),
                    }}
                  />
                  <span className="text-xs font-medium">{theme.label}</span>
                </div>

                <div className="flex gap-1">
                  {theme.colors.gradient.map((color, idx) => (
                    <div key={idx} className="flex-1 h-2 rounded-sm" style={{ backgroundColor: color }} />
                  ))}
                </div>

                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </Card>
            </button>
          )
        })}
      </div>
    </div>
  )
}

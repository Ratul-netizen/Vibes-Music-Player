"use client"

import { useState, useEffect, useCallback } from "react"

export type Theme = "neon-pulse" | "sunset-fade" | "arctic-wave" | "vintage-brown" | "minimal-dark"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = "playlist-theme"
const DEFAULT_THEME: Theme = "neon-pulse"

export function useTheme(): ThemeContextType {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)
  const [mounted, setMounted] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved && isValidTheme(saved)) {
      setThemeState(saved)
      applyTheme(saved)
    }
    setMounted(true)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    if (isValidTheme(newTheme)) {
      setThemeState(newTheme)
      applyTheme(newTheme)
      localStorage.setItem(STORAGE_KEY, newTheme)
    }
  }, [])

  return { theme: mounted ? theme : DEFAULT_THEME, setTheme }
}

function isValidTheme(value: string): value is Theme {
  return ["neon-pulse", "sunset-fade", "arctic-wave", "vintage-brown", "minimal-dark"].includes(value)
}

function applyTheme(theme: Theme) {
  const themeClass = `theme-${theme.replace("-", "")}`
  document.documentElement.className = themeClass
}

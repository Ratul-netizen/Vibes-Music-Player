"use client"

import { useTheme } from "@/hooks/use-theme"

export function AmbientBackground() {
  const { theme } = useTheme()

  return <div className={`bg-ambient ${theme}`} />
}

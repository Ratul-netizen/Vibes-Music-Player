"use client"

const STORAGE_PREFIX = "playlist-app-"

export function getPersistentState<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error("[v0] Error reading persisted state:", error)
    return defaultValue
  }
}

export function setPersistentState<T>(key: string, value: T): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.error("[v0] Error writing persisted state:", error)
  }
}

export function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = require("react").useState<T>(() => getPersistentState(key, defaultValue))

  const setPersisted = (value: T) => {
    setState(value)
    setPersistentState(key, value)
  }

  return [state, setPersisted]
}

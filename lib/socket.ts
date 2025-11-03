"use client"

import { io, Socket } from "socket.io-client"

type SocketEventCallback = (data: any) => void

interface SocketEventMap {
  connect: () => void
  disconnect: () => void
  "track:added": (data: { track: any }) => void
  "track:removed": (data: { id: string }) => void
  "track:voted": (data: { id: string; votes: number }) => void
  "track:reordered": (data: { playlist: any[] }) => void
  "user:joined": (data: { user: any }) => void
  "user:left": (data: { userId: string }) => void
  "message:sent": (data: { message: any }) => void
}

class SocketClient {
  private socket: Socket | null = null
  private listeners: Map<string, Set<SocketEventCallback>> = new Map()
  private isConnected = false
  private url: string

  constructor() {
    // Check if WebSocket is disabled via environment variable
    const wsEnabled = process.env.NEXT_PUBLIC_WS_ENABLED !== "false"
    
    if (!wsEnabled) {
      console.log("[Socket] WebSocket disabled - running in offline mode")
      return
    }

    // Use environment variable or fallback - dynamically choose based on environment
    const defaultUrl = typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000"
    
    this.url = defaultUrl
    
    // Don't auto-connect - let components decide when to connect
    // This prevents errors when server is not available
    if (typeof window !== "undefined") {
      // Delay connection to allow app to load first and prevent initial connection spam
      setTimeout(() => {
        this.connect()
      }, 2000) // Increased delay to 2 seconds
    }
  }

  connect() {
    if (this.socket?.connected) return

    try {
      this.socket = io(this.url, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5, // Limit attempts instead of infinite
        reconnectionDelay: 3000, // Start with 3 seconds
        reconnectionDelayMax: 10000, // Max 10 seconds between attempts
        timeout: 5000, // Shorter timeout
        autoConnect: true,
        // Suppress error logs
        forceNew: false,
      })

      // Suppress Socket.IO verbose logging
      if (this.socket.io) {
        this.socket.io.on("error", () => {
          // Silently handle connection errors - don't spam console
        })
      }

      this.socket.on("connect", () => {
        console.log("[Socket] ✓ Connected to server")
        this.isConnected = true
        this.emit("connect")
      })

      this.socket.on("disconnect", (reason) => {
        // Only log disconnects if we were previously connected
        if (this.isConnected) {
          console.log("[Socket] Disconnected:", reason)
        }
        this.isConnected = false
        this.emit("disconnect")
      })

      this.socket.on("reconnect", (attemptNumber) => {
        console.log("[Socket] ✓ Reconnected after", attemptNumber, "attempts")
        this.isConnected = true
        this.emit("connect")
      })

      // Suppress reconnection attempt logs - they're too verbose
      this.socket.on("reconnect_attempt", () => {
        // Silently attempt reconnection
      })

      this.socket.on("reconnect_error", () => {
        // Silently handle reconnection errors - don't spam console
        this.isConnected = false
      })

      this.socket.on("reconnect_failed", () => {
        // Only log once when all attempts failed
        if (!this.isConnected) {
          console.warn("[Socket] Server unavailable - running in offline mode")
          this.isConnected = false
          // Disable further reconnection attempts
          this.socket?.disconnect()
          this.socket = null
        }
      })

      this.socket.on("connect_error", () => {
        // Silently handle connection errors - don't spam console
        this.isConnected = false
        // After multiple failed attempts, stop trying
        if (this.socket && !this.socket.connected) {
          setTimeout(() => {
            if (this.socket && !this.socket.connected) {
              this.socket.disconnect()
              this.socket = null
            }
          }, 5000)
        }
      })

      // Forward all custom events
      this.socket.onAny((eventName, data) => {
        const callbacks = this.listeners.get(eventName)
        if (callbacks) {
          callbacks.forEach((callback) => callback(data))
        }
      })
    } catch (error) {
      // Silently handle initialization errors
      this.isConnected = false
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
    this.emit("disconnect")
  }

  emit<K extends keyof SocketEventMap>(event: K, data?: SocketEventMap[K]) {
    // Emit to server if connected
    if (this.socket?.connected) {
      this.socket.emit(event as string, data)
    }
    
    // Also trigger local listeners (for mock mode compatibility)
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  on<K extends keyof SocketEventMap>(event: K, callback: SocketEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // If socket is connected, register with socket.io
    if (this.socket?.connected && event !== "connect" && event !== "disconnect") {
      this.socket.on(event as string, callback)
    }

    return () => {
      this.listeners.get(event)?.delete(callback)
      if (this.socket?.connected && event !== "connect" && event !== "disconnect") {
        this.socket.off(event as string, callback)
      }
    }
  }

  off<K extends keyof SocketEventMap>(event: K, callback: SocketEventCallback) {
    this.listeners.get(event)?.delete(callback)
    if (this.socket?.connected) {
      this.socket.off(event as string, callback)
    }
  }

  isConnectedStatus(): boolean {
    return this.socket?.connected ?? this.isConnected
  }
}

export const socket = new SocketClient()

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
    // Use environment variable or fallback to localhost for development
    this.url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000"
    
    // Initialize socket connection
    if (typeof window !== "undefined") {
      this.connect()
    }
  }

  connect() {
    if (this.socket?.connected) return

    try {
      this.socket = io(this.url, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      this.socket.on("connect", () => {
        console.log("[Socket] Connected to server")
        this.isConnected = true
        this.emit("connect")
      })

      this.socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason)
        this.isConnected = false
        this.emit("disconnect")
      })

      this.socket.on("connect_error", (error) => {
        console.warn("[Socket] Connection error:", error)
        // Fallback to mock mode if server is not available
        if (!this.isConnected) {
          this.isConnected = true // Simulate connection for demo
          this.emit("connect")
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
      console.warn("[Socket] Failed to initialize, using mock mode:", error)
      // Fallback to mock mode
      this.isConnected = true
      this.emit("connect")
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

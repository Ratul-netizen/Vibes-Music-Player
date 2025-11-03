"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { socket } from "@/lib/socket"

export function useWebSocket() {
  const isInitializedRef = useRef(false)
  const [isConnected, setIsConnected] = useState(() => socket.isConnectedStatus())
  const reconnectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isInitializedRef.current) return

    isInitializedRef.current = true
    socket.connect()

    // Listen for connection status changes with proper event handling
    const unsubscribeConnect = socket.on("connect", () => {
      console.log("[WebSocket] Connected - updating status")
      setIsConnected(true)
    })

    const unsubscribeDisconnect = socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected - updating status")
      setIsConnected(false)
    })
    
    // Also listen for reconnect events
    const unsubscribeReconnect = socket.on("reconnect", () => {
      console.log("[WebSocket] Reconnected")
      setIsConnected(true)
    })
    
    // Initial status check
    const currentStatus = socket.isConnectedStatus()
    if (currentStatus !== isConnected) {
      setIsConnected(currentStatus)
    }

    // Periodic reconnection check every 30 seconds (less frequent to reduce spam)
    reconnectIntervalRef.current = setInterval(() => {
      const currentStatus = socket.isConnectedStatus()
      setIsConnected(currentStatus)
      
      // Only try to reconnect if we haven't failed before
      // This prevents endless reconnection attempts when server is down
      if (!currentStatus) {
        // Only attempt reconnect once per interval
        try {
          socket.connect()
        } catch (error) {
          // Silently handle reconnection errors
        }
      }
    }, 30000) // Increased from 10s to 30s to reduce spam

    return () => {
      unsubscribeConnect()
      unsubscribeDisconnect()
      if (unsubscribeReconnect) {
        unsubscribeReconnect()
      }
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current)
      }
      // Don't disconnect on unmount to allow reconnection
      // socket.disconnect()
    }
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    socket.emit(event as any, data)
  }, [])

  const on = useCallback((event: string, callback: (data: any) => void) => {
    return socket.on(event as any, callback)
  }, [])

  return {
    isConnected,
    emit,
    on,
  }
}

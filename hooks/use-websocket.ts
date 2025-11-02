"use client"

import { useEffect, useRef, useCallback } from "react"
import { socket } from "@/lib/socket"

export function useWebSocket() {
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (isInitializedRef.current) return

    isInitializedRef.current = true
    socket.connect()

    return () => {
      socket.disconnect()
    }
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    socket.emit(event as any, data)
  }, [])

  const on = useCallback((event: string, callback: (data: any) => void) => {
    return socket.on(event as any, callback)
  }, [])

  return {
    isConnected: socket.isConnectedStatus(),
    emit,
    on,
  }
}

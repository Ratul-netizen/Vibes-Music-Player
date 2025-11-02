"use client"

import type React from "react"

import { useRef, useCallback } from "react"

export function useSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
) {
  const touchStartRef = useRef({ x: 0, y: 0 })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      }

      const diffX = touchStartRef.current.x - touchEnd.x
      const diffY = touchStartRef.current.y - touchEnd.y
      const threshold = 50

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > threshold) {
          onSwipeLeft?.()
        } else if (diffX < -threshold) {
          onSwipeRight?.()
        }
      } else {
        if (diffY > threshold) {
          onSwipeUp?.()
        } else if (diffY < -threshold) {
          onSwipeDown?.()
        }
      }
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown],
  )

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  }
}

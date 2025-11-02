"use client"

import { useEffect, useRef } from "react"
import { usePlayerStore } from "@/store/use-player-store"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const { isPlaying, currentTrack } = usePlayerStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // Initialize particles
    const particleCount = 50
    particlesRef.current = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
    }))

    let amplitude = 0
    const updateAmplitude = () => {
      if (isPlaying) {
        amplitude = Math.sin(Date.now() / 500) * 0.5 + 0.5
      } else {
        amplitude *= 0.95 // Fade out when not playing
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      updateAmplitude()

      particlesRef.current.forEach((particle) => {
        // Move particles
        particle.x += particle.vx * (1 + amplitude * 0.5)
        particle.y += particle.vy * (1 + amplitude * 0.5)

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Draw particle with pulsing size
        const size = particle.size * (1 + amplitude * 0.3)
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(147, 51, 234, ${particle.opacity * (0.5 + amplitude * 0.5)})`
        ctx.fill()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, currentTrack])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-30"
      style={{ zIndex: 1 }}
    />
  )
}


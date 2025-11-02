"use client"

import { motion } from "framer-motion"

interface GlowHaloProps {
  isActive?: boolean
  color?: string
  size?: number
  className?: string
}

export function GlowHalo({ isActive = false, color = "purple", size = 20, className = "" }: GlowHaloProps) {
  if (!isActive) return null

  const colorClasses = {
    purple: "bg-purple-500/30",
    cyan: "bg-cyan-500/30",
    pink: "bg-pink-500/30",
  }

  return (
    <motion.div
      className={`absolute inset-0 rounded-lg pointer-events-none ${className}`}
      animate={{
        boxShadow: [
          `0 0 ${size}px ${colorClasses[color as keyof typeof colorClasses] || colorClasses.purple}`,
          `0 0 ${size * 1.5}px ${colorClasses[color as keyof typeof colorClasses] || colorClasses.purple}`,
          `0 0 ${size}px ${colorClasses[color as keyof typeof colorClasses] || colorClasses.purple}`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}


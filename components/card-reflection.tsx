"use client"

import { motion } from "framer-motion"

interface CardReflectionProps {
  children: React.ReactNode
  className?: string
}

export function CardReflection({ children, className = "" }: CardReflectionProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {/* Soft blur reflection */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-20 transition-opacity duration-300"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
          filter: "blur(8px)",
          transform: "scaleY(-1) translateY(-100%)",
        }}
      />
    </div>
  )
}


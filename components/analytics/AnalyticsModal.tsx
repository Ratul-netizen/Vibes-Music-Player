"use client"

import dynamic from "next/dynamic"
import { Suspense, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false })
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false })

interface AnalyticsModalProps {
  open: boolean
  onClose: () => void
  sessions: Array<{ day: string; plays: number }>
  genres: Array<{ name: string; value: number }>
}

export default function AnalyticsModal({ open, onClose, sessions, genres }: AnalyticsModalProps) {
  const colors = ["#a855f7", "#ec4899", "#22d3ee", "#34d399", "#f59e0b"]

  const sessionData = useMemo(() => sessions, [sessions])
  const genreData = useMemo(() => genres, [genres])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-[min(90vw,820px)] rounded-2xl border border-white/10 bg-[#0b0f17]/95 backdrop-blur-xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Playlist Analytics</h3>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-6">
              {/* Play Activity Chart */}
              <div className="rounded-xl bg-white/5 p-4 h-64">
                <h4 className="text-sm font-semibold mb-3 text-white/90">Play Activity</h4>
                <Suspense fallback={<div className="animate-pulse h-full rounded-xl bg-white/10" />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sessionData}>
                      <XAxis 
                        dataKey="day" 
                        stroke="rgba(148, 163, 184, 0.5)" 
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis 
                        stroke="rgba(148, 163, 184, 0.5)" 
                        style={{ fontSize: "12px" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="plays" 
                        stroke="#a855f7" 
                        strokeWidth={2}
                        dot={false} 
                        isAnimationActive={true}
                        animationDuration={400}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Suspense>
              </div>

              {/* Genre Distribution Chart */}
              <div className="rounded-xl bg-white/5 p-4 h-64">
                <h4 className="text-sm font-semibold mb-3 text-white/90">Genre Distribution</h4>
                <Suspense fallback={<div className="animate-pulse h-full rounded-xl bg-white/10" />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genreData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        isAnimationActive={true}
                        animationDuration={400}
                      >
                        {genreData.map((_, i) => (
                          <Cell key={i} fill={colors[i % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Suspense>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}


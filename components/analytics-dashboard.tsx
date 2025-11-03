"use client"

import { useState, useMemo, Suspense, lazy } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Calendar, Music } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load Recharts components
const ResponsiveContainer = lazy(() => 
  import("recharts").then(mod => ({ default: mod.ResponsiveContainer }))
)
const LineChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.LineChart }))
)
const Line = lazy(() => 
  import("recharts").then(mod => ({ default: mod.Line }))
)
const XAxis = lazy(() => 
  import("recharts").then(mod => ({ default: mod.XAxis }))
)
const YAxis = lazy(() => 
  import("recharts").then(mod => ({ default: mod.YAxis }))
)
const CartesianGrid = lazy(() => 
  import("recharts").then(mod => ({ default: mod.CartesianGrid }))
)
const Tooltip = lazy(() => 
  import("recharts").then(mod => ({ default: mod.Tooltip }))
)
const PieChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.PieChart }))
)
const Pie = lazy(() => 
  import("recharts").then(mod => ({ default: mod.Pie }))
)
const Cell = lazy(() => 
  import("recharts").then(mod => ({ default: mod.Cell }))
)

export interface PlayHistoryItem {
  id: string
  title: string
  artist: string
  playedAt: Date
  duration: number
  votes: number
}

export interface Analytics {
  totalTracksPlayed: number
  totalPlaytime: number
  mostPlayedGenre: string
  averageVotesPerTrack: number
  topArtist: string
  sessionCount: number
  dailyPlayHistory: Array<{ date: string; count: number }>
  genreDistribution: Array<{ name: string; value: number }>
  topTracks: Array<{ title: string; plays: number; artist: string }>
}

interface AnalyticsDashboardProps {
  analytics: Analytics
  history: PlayHistoryItem[]
}

const COLORS = ["#a78bfa", "#06b6d4", "#ec4899", "#fbbf24", "#14b8a6"]

// Memoized chart data components for performance
const ChartSkeleton = () => (
  <div className="w-full h-[250px] flex items-center justify-center">
    <Skeleton className="w-full h-full" />
  </div>
)

function PlayActivityChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const memoizedData = useMemo(() => data, [data])
  
  return (
    <ErrorBoundary fallback={<ChartSkeleton />}>
      <Suspense fallback={<ChartSkeleton />}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={memoizedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
          <XAxis dataKey="date" stroke="rgba(148, 163, 184, 0.5)" />
          <YAxis stroke="rgba(148, 163, 184, 0.5)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={400}
          />
          </LineChart>
        </ResponsiveContainer>
      </Suspense>
    </ErrorBoundary>
  )
}

function GenreDistributionChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const memoizedData = useMemo(() => data, [data])
  
  return (
    <ErrorBoundary fallback={<ChartSkeleton />}>
      <Suspense fallback={<ChartSkeleton />}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
          <Pie
            data={memoizedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive={true}
            animationDuration={400}
          >
            {COLORS.map((color, idx) => (
              <Cell key={`cell-${idx}`} fill={color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "8px",
            }}
          />
          </PieChart>
        </ResponsiveContainer>
      </Suspense>
    </ErrorBoundary>
  )
}

export function AnalyticsDashboard({ analytics, history }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week")

  const formatDuration = useMemo(() => (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }, [])

  const formatPlaytime = useMemo(() => (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }, [])

  // Memoize chart data to prevent unnecessary re-renders
  const memoizedDailyHistory = useMemo(() => analytics.dailyPlayHistory, [analytics.dailyPlayHistory])
  const memoizedGenreDistribution = useMemo(() => analytics.genreDistribution, [analytics.genreDistribution])
  const memoizedTopTracks = useMemo(() => analytics.topTracks.slice(0, 5), [analytics.topTracks])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 bg-transparent">
          <TrendingUp className="w-4 h-4" />
          Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Playlist Analytics</DialogTitle>
          <DialogDescription>View detailed statistics and history of your playlist activity</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tracks Played</p>
                    <p className="text-2xl font-bold">{analytics.totalTracksPlayed}</p>
                  </div>
                  <Music className="w-8 h-8 text-purple-500 opacity-20" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Playtime</p>
                    <p className="text-2xl font-bold">{formatPlaytime(analytics.totalPlaytime)}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-cyan-500 opacity-20" />
                </div>
              </Card>

              <Card className="p-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Top Genre</p>
                  <p className="text-xl font-bold">{analytics.mostPlayedGenre}</p>
                </div>
              </Card>

              <Card className="p-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Avg. Votes/Track</p>
                  <p className="text-xl font-bold">{analytics.averageVotesPerTrack.toFixed(1)}</p>
                </div>
              </Card>

              <Card className="p-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Top Artist</p>
                  <p className="text-sm font-bold truncate">{analytics.topArtist}</p>
                </div>
              </Card>

              <Card className="p-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sessions</p>
                  <p className="text-xl font-bold">{analytics.sessionCount}</p>
                </div>
              </Card>
            </div>

            {/* Top Tracks */}
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-3">Top Tracks</h4>
              <div className="space-y-2">
                {memoizedTopTracks.map((track, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <Badge variant="secondary">{track.plays} plays</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-4">
            {/* Play History Chart */}
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-3">Play Activity</h4>
              <PlayActivityChart data={memoizedDailyHistory} />
            </Card>

            {/* Genre Distribution */}
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-3">Genre Distribution</h4>
              <GenreDistributionChart data={memoizedGenreDistribution} />
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-2">
            {history.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No playback history yet.</p>
              </Card>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.artist}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">{new Date(item.playedAt).toLocaleDateString()}</p>
                        <Badge variant="outline" className="text-xs">
                          {item.votes > 0 ? `+${item.votes}` : item.votes}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

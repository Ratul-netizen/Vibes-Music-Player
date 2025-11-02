"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Play, Pause, SkipForward, SkipBack, Volume2, Minimize2, Maximize2, X, Shuffle, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { usePlayerStore } from "@/store/use-player-store"
import { extractDominantColor } from "@/lib/color-extractor"
import { ParticleBackground } from "@/components/particle-background"
// @ts-ignore - wavesurfer.js types may not be available
import WaveSurfer from "wavesurfer.js"

interface NowPlayingBubbleProps {
  onSkipNext?: () => void
  onSkipPrevious?: () => void
  onShuffle?: () => void
  onRepeat?: () => void
  shuffleActive?: boolean
  repeatMode?: "off" | "all" | "one"
}

export function NowPlayingBubble({ 
  onSkipNext, 
  onSkipPrevious, 
  onShuffle, 
  onRepeat, 
  shuffleActive = false,
  repeatMode = "off"
}: NowPlayingBubbleProps) {
  const { currentTrack, isPlaying, progress, togglePlay } = usePlayerStore()
  const track = currentTrack
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [waveformReady, setWaveformReady] = useState(false)
  const [currentAmplitude, setCurrentAmplitude] = useState(0)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [dominantColor, setDominantColor] = useState<string>("#9333ea")
  const [showLyrics, setShowLyrics] = useState(true)
  
  // Throttled amplitude updates for performance
  const lastUpdateRef = useRef(0)
  const throttledAmplitude = useRef(0)
  
  const coverUrl = track?.cover_url || track?.coverUrl || "/placeholder.svg"
  
  // Extract dominant color from album art for fullscreen background
  useEffect(() => {
    if (isFullscreen && track && coverUrl) {
      extractDominantColor(coverUrl)
        .then((color) => setDominantColor(color))
        .catch(() => setDominantColor("#9333ea"))
    }
  }, [isFullscreen, track, coverUrl])
  
  // Parse lyrics into lines for highlighting
  const lyricsLines = useMemo(() => {
    if (!track?.lyrics) return []
    return track.lyrics.split("\n").filter((line) => line.trim())
  }, [track?.lyrics])
  
  // Calculate current lyric line based on progress (simple approximation)
  const currentLyricIndex = useMemo(() => {
    if (!lyricsLines.length || !track?.duration_seconds) return -1
    const progressRatio = progress / 100
    return Math.floor(progressRatio * lyricsLines.length)
  }, [progress, lyricsLines.length, track?.duration_seconds])

  // Initialize waveform and audio analysis
  useEffect(() => {
    if (!waveformRef.current || !track) return

    // Create waveform instance with enhanced settings for fullscreen
    // @ts-ignore
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "rgba(255, 255, 255, 0.3)",
      progressColor: isFullscreen ? "rgba(147, 51, 234, 0.9)" : "rgba(147, 51, 234, 0.8)",
      cursorColor: "rgba(34, 211, 238, 0.8)",
      barWidth: isFullscreen ? 3 : 2,
      barRadius: isFullscreen ? 3 : 2,
      height: isFullscreen ? 200 : isExpanded ? 120 : 40,
      normalize: true,
      interact: isExpanded || isFullscreen,
      backend: "WebAudio",
      barGap: isFullscreen ? 2 : 1,
    })

    wavesurferRef.current = wavesurfer

    // Set up audio analyser for rhythm visualization
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      // Visualize amplitude
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const updateAmplitude = () => {
        const now = Date.now()
        if (analyser && isPlaying) {
          analyser.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
          throttledAmplitude.current = Math.min(avg / 255, 1)
          
          // Throttle state updates to ~30fps for better performance
          if (now - lastUpdateRef.current > 33) {
            setCurrentAmplitude(throttledAmplitude.current)
            lastUpdateRef.current = now
          }
        } else {
          setCurrentAmplitude(0)
        }
        if (isPlaying) {
          animationFrameRef.current = requestAnimationFrame(updateAmplitude)
        }
      }

      if (isPlaying) {
        updateAmplitude()
      }
    } catch (error) {
      console.warn("Could not initialize audio analyser:", error)
    }

    // Generate demo waveform data (since we don't have actual audio files)
    // In production, you would load an actual audio URL
    const generateDemoWaveform = () => {
      try {
        // Create a silent audio buffer for waveform visualization
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const buffer = audioContext.createBuffer(1, 44100 * track.duration_seconds, 44100)
        const data = buffer.getChannelData(0)
        
        // Generate random waveform data
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 0.3 - 0.15
        }
        
        // @ts-ignore
        wavesurfer.loadDecodedBuffer(buffer)
        setTimeout(() => {
          setWaveformReady(true)
        }, 500)
      } catch (error) {
        console.warn("Could not generate waveform:", error)
        setWaveformReady(true) // Still show UI even if waveform fails
      }
    }

    generateDemoWaveform()

    // Update progress
    const updateProgress = () => {
      if (wavesurfer && isPlaying) {
        const duration = wavesurfer.getDuration()
        if (duration > 0) {
          const newTime = (progress / 100) * duration
          wavesurfer.seekTo(progress / 100)
          setCurrentTime(newTime)
        }
      }
    }

    updateProgress()
    const interval = setInterval(updateProgress, 100)

    // Handle waveform click (seek) - enhanced for fullscreen
    wavesurfer.on("seek", (seekProgress) => {
      const newTime = seekProgress * track.duration_seconds
      setCurrentTime(newTime)
      const newProgress = (seekProgress * 100)
      usePlayerStore.getState().setProgress(newProgress)
    })
    
    // Make waveform interactive in fullscreen with enhanced settings
    if (isFullscreen) {
      // @ts-ignore
      wavesurfer.setOptions({ 
        interact: true,
        height: 200,
        barWidth: 3,
      })
    }

    return () => {
      clearInterval(interval)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      wavesurfer.destroy()
      wavesurferRef.current = null
      analyserRef.current = null
    }
  }, [track, isExpanded, isFullscreen, isPlaying, progress])

  // Auto-collapse on inactivity
  useEffect(() => {
    if (isExpanded) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      inactivityTimerRef.current = setTimeout(() => {
        setIsExpanded(false)
      }, 10000) // Collapse after 10 seconds of inactivity
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [isExpanded])

  // Reset timer on interaction
  const handleInteraction = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    setIsExpanded(true)
  }, [])

  if (!track) {
    return null
  }

  const totalDuration = track.duration_seconds
  const elapsedTime = currentTime || (progress / 100) * totalDuration

  // Responsive positioning
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768
  
  return (
    <AnimatePresence>
      <motion.div
        layout
        className={`fixed ${
          isFullscreen 
            ? "inset-0 z-[100]" 
            : isMobile 
              ? "bottom-0 left-0 right-0 z-50 rounded-t-2xl"
              : "bottom-6 right-6 z-50"
        }`}
        initial={false}
        animate={{
          width: isFullscreen ? "100%" : isMobile ? "100%" : isExpanded ? "420px" : "320px",
          height: isFullscreen ? "100%" : isMobile ? "auto" : "auto",
          borderRadius: isFullscreen ? "0px" : isMobile ? "24px 24px 0 0" : "24px",
        }}
        style={{ willChange: "transform" }} // GPU acceleration
        transition={{ type: "spring", damping: 18, stiffness: 200 }}
        onMouseEnter={handleInteraction}
        onMouseMove={handleInteraction}
        onClick={() => !isExpanded && !isFullscreen && !isMobile && setIsExpanded(true)}
      >
        {/* Fullscreen Dynamic Background with album art */}
        {isFullscreen && (
          <motion.div
            className="absolute inset-0 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${coverUrl})`,
                filter: "blur(80px) brightness(0.3)",
                transform: "scale(1.1)",
              }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-br opacity-60"
              style={{
                background: `linear-gradient(to bottom right, ${dominantColor}80, ${dominantColor}40, transparent)`,
              }}
            />
            <ParticleBackground />
            {/* Pulsing glow overlay */}
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                opacity: isPlaying ? 0.3 + currentAmplitude * 0.2 : 0.1,
              }}
              transition={{ duration: 0.3 }}
              style={{
                background: `radial-gradient(circle at center, ${dominantColor} 0%, transparent 70%)`,
              }}
            />
          </motion.div>
        )}
        
        <motion.div
          className={`glass shadow-2xl overflow-hidden border border-white/10 backdrop-blur-2xl h-full ${
            isExpanded || isFullscreen ? "p-6" : "p-4"
          } hover:border-white/20 transition-all duration-300 flex flex-col ${
            isPlaying ? "ring-2 ring-purple-500/50" : ""
          }`}
          style={{
            boxShadow: isPlaying
              ? `0 0 ${20 + currentAmplitude * 60}px rgba(147, 51, 234, ${0.4 + currentAmplitude * 0.3}), 0 0 ${40 + currentAmplitude * 100}px rgba(34, 211, 238, ${0.2 + currentAmplitude * 0.2}), 0 0 ${80 + currentAmplitude * 120}px rgba(236, 72, 153, ${0.1 + currentAmplitude * 0.15})`
              : undefined,
          }}
          animate={
            isPlaying
              ? {
                  boxShadow: `0 0 ${20 + currentAmplitude * 60}px rgba(147, 51, 234, ${0.4 + currentAmplitude * 0.3}), 0 0 ${40 + currentAmplitude * 100}px rgba(34, 211, 238, ${0.2 + currentAmplitude * 0.2}), 0 0 ${80 + currentAmplitude * 120}px rgba(236, 72, 153, ${0.1 + currentAmplitude * 0.15})`,
                }
              : {}
          }
          transition={{ duration: 0.1 }}
        >
        {/* Header - Different layout for fullscreen */}
        {isFullscreen ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-8 max-w-5xl mx-auto w-full"
          >
            <div className="flex items-center gap-6 flex-1">
              <div
                className="relative flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20"
                style={{ width: "120px", height: "120px" }}
              >
                <img
                  src={coverUrl}
                  alt={`${track.album} cover`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-cyan-500/30 animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 truncate">{track.title}</h2>
                <p className="text-lg text-white/80 truncate mb-1">{track.artist}</p>
                <p className="text-sm text-white/60">{track.album}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation()
                setIsFullscreen(false)
                setIsExpanded(true)
              }}
            >
              <Minimize2 className="w-5 h-5" />
            </Button>
          </motion.div>
        ) : (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="relative flex-shrink-0 rounded-xl overflow-hidden shadow-lg"
                style={{ width: isExpanded ? "64px" : "56px", height: isExpanded ? "64px" : "56px" }}
              >
                <img
                  src={coverUrl}
                  alt={`${track.album} cover`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate text-sm">{track.title}</h3>
                <p className="text-xs text-gray-400 truncate">{track.artist}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsFullscreen(true)
                }}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              {!isFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(!isExpanded)
                  }}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Waveform - Enhanced for fullscreen */}
        {(isExpanded || isFullscreen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: waveformReady ? 1 : 0 }}
            transition={{ delay: isFullscreen ? 0.3 : 0 }}
            className={`mb-4 ${isFullscreen ? "flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full" : ""}`}
          >
            <div 
              ref={waveformRef} 
              className="w-full bg-white/5 backdrop-blur-xl rounded-lg p-4 cursor-pointer" 
              style={{ 
                minHeight: isFullscreen ? "200px" : "80px",
                willChange: "contents" // GPU acceleration
              }}
              onClick={(e) => {
                if (isFullscreen && wavesurferRef.current) {
                  // Allow clicking on waveform to seek (handled by wavesurfer)
                  e.stopPropagation()
                }
              }}
            />
            {!waveformReady && (
              <div className={`w-full ${isFullscreen ? "h-48" : "h-20"} flex items-center justify-center text-gray-400 text-xs`}>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  Loading waveform...
                </motion.div>
              </div>
            )}
            {/* Rhythm visualization bars - only show in fullscreen */}
            {isPlaying && isFullscreen && (
              <div className="flex items-end justify-center gap-1 h-16 mt-4">
                {Array.from({ length: 40 }).map((_, i) => {
                  const barHeight = Math.abs(Math.sin((Date.now() / 100 + i * 0.3) * 2)) * currentAmplitude * 100
                  return (
                    <motion.div
                      key={i}
                      className="w-1 bg-gradient-to-t from-purple-500 via-pink-500 to-cyan-500 rounded-full"
                      animate={{
                        height: `${30 + barHeight}%`,
                      }}
                      transition={{ duration: 0.1, ease: "easeOut" }}
                      style={{ willChange: "height" }}
                    />
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Always-visible Progress Bar - Above Controls */}
        <motion.div
          initial={isFullscreen ? { opacity: 0 } : {}}
          animate={isFullscreen ? { opacity: 1 } : {}}
          transition={{ delay: isFullscreen ? 0.35 : 0 }}
          className={`mb-3 ${isFullscreen ? "max-w-5xl mx-auto w-full" : ""}`}
        >
          <div className="w-full bg-white/15 rounded-full h-1 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 20 }}
              style={{ willChange: "width" }} // GPU acceleration
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(Math.floor(elapsedTime))}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </motion.div>

        {/* Lyrics display - Enhanced for fullscreen */}
        {track.lyrics && (isExpanded || isFullscreen) && showLyrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isFullscreen ? 0.4 : 0 }}
            className={`mb-4 relative ${isFullscreen ? "max-w-3xl mx-auto w-full" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lyrics</h4>
              {isFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-gray-400 hover:text-white"
                  onClick={() => setShowLyrics(false)}
                >
                  Hide Lyrics
                </Button>
              )}
            </div>
            <div className="relative">
              {/* Fading gradient overlay at top */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background/95 to-transparent pointer-events-none z-10" />
              {/* Fading gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/95 to-transparent pointer-events-none z-10" />
              <div className={`overflow-y-auto text-gray-300 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent pr-2 scroll-smooth ${
                isFullscreen ? "h-48 text-center" : "max-h-32"
              }`}>
                {isFullscreen && lyricsLines.length > 0 ? (
                  lyricsLines.map((line, i) => (
                    <motion.p
                      key={i}
                      className={`py-1 transition-all ${
                        i === currentLyricIndex
                          ? "text-purple-300 font-medium scale-105"
                          : "text-gray-400"
                      }`}
                      animate={{
                        opacity: i === currentLyricIndex ? 1 : 0.6,
                      }}
                    >
                      {line || "\u00A0"}
                    </motion.p>
                  ))
                ) : (
                  <p className="whitespace-pre-line">{track.lyrics}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Show Lyrics toggle for fullscreen */}
        {isFullscreen && track.lyrics && !showLyrics && (
          <div className="mb-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 hover:text-white"
              onClick={() => setShowLyrics(true)}
            >
              Show Lyrics
            </Button>
          </div>
        )}

        {/* Controls with Shuffle & Repeat - Enhanced layout for fullscreen */}
        {isFullscreen ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center justify-center gap-6 mt-6 max-w-5xl mx-auto w-full"
          >
            <div className="flex items-center justify-center gap-6 w-full">
              {/* Shuffle Button */}
              <Button
                variant="ghost"
                size="sm"
                className={`h-12 w-12 p-0 transition-colors ${
                  shuffleActive ? "text-purple-400" : "text-white/70 hover:text-purple-300"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onShuffle?.()
                }}
              >
                <Shuffle className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-12 w-12 p-0 text-white/70 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onSkipPrevious?.()
                }}
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button
                size="lg"
                className="h-14 w-14 p-0 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:scale-110 transition-transform shadow-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay()
                }}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white ml-1" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-12 w-12 p-0 text-white/70 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onSkipNext?.()
                }}
              >
                <SkipForward className="w-5 h-5" />
              </Button>
              
              {/* Repeat Button */}
              <Button
                variant="ghost"
                size="sm"
                className={`h-12 w-12 p-0 transition-colors relative ${
                  repeatMode !== "off" ? "text-purple-400" : "text-white/70 hover:text-purple-300"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onRepeat?.()
                }}
              >
                <Repeat className="w-5 h-5" />
                {repeatMode === "one" && (
                  <span className="absolute -top-1 -right-1 text-[10px] text-purple-400 font-bold bg-background rounded-full w-4 h-4 flex items-center justify-center">1</span>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center justify-center gap-5 flex-1">
              {/* Shuffle Button */}
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 p-0 transition-colors ${
                  shuffleActive ? "text-purple-400" : "text-gray-400 hover:text-purple-300"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onShuffle?.()
                }}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-gray-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onSkipPrevious?.()
                }}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                className="h-10 w-10 p-0 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay()
                }}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-gray-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onSkipNext?.()
                }}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              
              {/* Repeat Button */}
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 p-0 transition-colors relative ${
                  repeatMode !== "off" ? "text-purple-400" : "text-gray-400 hover:text-purple-300"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onRepeat?.()
                }}
              >
                <Repeat className="w-4 h-4" />
                {repeatMode === "one" && (
                  <span className="absolute -top-1 -right-1 text-[8px] text-purple-400 font-bold bg-background rounded-full w-3 h-3 flex items-center justify-center">1</span>
                )}
              </Button>
            </div>

            {isExpanded && (
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value))
                    if (wavesurferRef.current) {
                      wavesurferRef.current.setVolume(parseFloat(e.target.value))
                    }
                  }}
                  className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            )}
          </div>
        )}
        
        {/* Volume control for fullscreen - separate row */}
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-3 mt-4 max-w-5xl mx-auto w-full"
          >
            <Volume2 className="w-5 h-5 text-white/70" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value))
                if (wavesurferRef.current) {
                  wavesurferRef.current.setVolume(parseFloat(e.target.value))
                }
              }}
              className="flex-1 max-w-xs h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </motion.div>
        )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}


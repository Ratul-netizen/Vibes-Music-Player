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
  const [isClosed, setIsClosed] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [waveformReady, setWaveformReady] = useState(false)
  const [currentAmplitude, setCurrentAmplitude] = useState(0)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastMouseMoveRef = useRef(0)
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

  // Re-open bubble automatically when a track is selected/changed or playback starts
  useEffect(() => {
    if (track) {
      setIsClosed(false)
    }
  }, [track?.id])

  useEffect(() => {
    if (isPlaying) {
      setIsClosed(false)
    }
  }, [isPlaying])
  
  // Calculate current lyric line based on progress (simple approximation)
  const currentLyricIndex = useMemo(() => {
    if (!lyricsLines.length || !track?.duration_seconds) return -1
    const progressRatio = progress / 100
    return Math.floor(progressRatio * lyricsLines.length)
  }, [progress, lyricsLines.length, track?.duration_seconds])

  // Initialize waveform and audio analysis - memoized to prevent reinit
  useEffect(() => {
    if (!waveformRef.current || !track) return
    
    // Clean up previous instance
    if (wavesurferRef.current) {
      const ws = wavesurferRef.current
      try {
        ws.destroy()
      } catch (error) {
        console.warn("Error destroying wavesurfer:", error)
      }
      wavesurferRef.current = null
    }

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
      // Performance optimizations
      pixelRatio: window.devicePixelRatio || 1,
    })

    wavesurferRef.current = wavesurfer
    
    // Debounced progress update function
    let lastUpdateTime = 0
    const debounceDelay = 200 // Update max every 200ms
    
    const handleAudioProcess = () => {
      const now = Date.now()
      if (now - lastUpdateTime < debounceDelay) return
      lastUpdateTime = now
      
      if (wavesurfer && isPlaying) {
        const currentTime = wavesurfer.getCurrentTime()
        const duration = wavesurfer.getDuration()
        if (duration > 0) {
          const newProgress = (currentTime / duration) * 100
          usePlayerStore.getState().setProgress(newProgress)
          setCurrentTime(currentTime)
        }
      }
    }
    
    // Store unsubscribe function for proper cleanup
    const unsubscribeAudioProcess = wavesurfer.on("audioprocess", handleAudioProcess)

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
    const generateDemoWaveform = async () => {
      try {
        // For Wavesurfer v7, use load() method - do NOT use loadDecodedBuffer (removed in v7)
        if (track.audioUrl) {
          await wavesurfer.load(track.audioUrl)
          setWaveformReady(true)
        } else {
          // If no audio URL, create a simple silent waveform
          // Generate a minimal audio blob for visualization
          const sampleRate = 44100
          const duration = track.duration_seconds || 180
          const numSamples = sampleRate * duration
          const buffer = new ArrayBuffer(44 + numSamples * 2)
          const view = new DataView(buffer)
          
          // WAV header
          const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i))
            }
          }
          
          writeString(0, 'RIFF')
          view.setUint32(4, 36 + numSamples * 2, true)
          writeString(8, 'WAVE')
          writeString(12, 'fmt ')
          view.setUint32(16, 16, true)
          view.setUint16(20, 1, true)
          view.setUint16(22, 1, true)
          view.setUint32(24, sampleRate, true)
          view.setUint32(28, sampleRate * 2, true)
          view.setUint16(32, 2, true)
          view.setUint16(34, 16, true)
          writeString(36, 'data')
          view.setUint32(40, numSamples * 2, true)
          
          // Generate silent/quiet waveform data
          const samples = new Int16Array(buffer, 44)
          for (let i = 0; i < numSamples; i++) {
            samples[i] = Math.floor(Math.sin(i * 0.01) * 1000) // Subtle waveform
          }
          
          const blob = new Blob([buffer], { type: 'audio/wav' })
          const url = URL.createObjectURL(blob)
          
          try {
            await wavesurfer.load(url)
            setWaveformReady(true)
            // Clean up blob URL after loading
            setTimeout(() => URL.revokeObjectURL(url), 1000)
          } catch {
            setWaveformReady(true) // Still show UI even if waveform fails
          }
        }
      } catch (error) {
        console.warn("Could not generate waveform:", error)
        setWaveformReady(true) // Still show UI even if waveform fails
      }
    }

    generateDemoWaveform()

    // Sync waveform with store progress (when progress changes externally)
    const syncWaveformProgress = () => {
      if (wavesurfer && wavesurfer.getDuration() > 0) {
        const currentWaveformProgress = wavesurfer.getCurrentTime() / wavesurfer.getDuration()
        const storeProgress = progress / 100
        
        // Only update if there's a significant difference (avoid feedback loop)
        if (Math.abs(currentWaveformProgress - storeProgress) > 0.02) {
          wavesurfer.seekTo(storeProgress)
          setCurrentTime(storeProgress * wavesurfer.getDuration())
        }
      }
    }

    // Throttled sync to avoid excessive updates
    const syncInterval = setInterval(syncWaveformProgress, 200)

    // Handle waveform click (seek) - enhanced for fullscreen
    const unsubscribeSeek = wavesurfer.on("seek", (seekProgress) => {
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
      clearInterval(syncInterval)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      // Unsubscribe from events using the returned functions
      if (unsubscribeAudioProcess) {
        unsubscribeAudioProcess()
      }
      if (unsubscribeSeek) {
        unsubscribeSeek()
      }
      // Destroy wavesurfer instance
      try {
        wavesurfer.destroy()
      } catch (error) {
        console.warn("Error destroying wavesurfer:", error)
      }
      wavesurferRef.current = null
      analyserRef.current = null
    }
  }, [track, isExpanded, isFullscreen, isPlaying, progress])

  // Responsive positioning - calculate early
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

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

  // Reset timer on interaction - throttled to prevent excessive state updates
  const handleInteraction = useCallback(() => {
    // Only handle interaction if not already expanded/fullscreen and not mobile
    if (isFullscreen || isMobile) return
    
    try {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      
      // Only expand if not already expanded to prevent unnecessary re-renders
      if (!isExpanded) {
        setIsExpanded(true)
      }
    } catch (error) {
      console.warn("Error in handleInteraction:", error)
    }
  }, [isExpanded, isFullscreen, isMobile])

  if (isClosed || !track) {
    return null
  }

  const totalDuration = track.duration_seconds
  const elapsedTime = currentTime || (progress / 100) * totalDuration
  
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  const springTransition = prefersReducedMotion 
    ? { duration: 0.2 }
    : { type: "spring", stiffness: 120, damping: 20 }

  return (
    <AnimatePresence>
      {/* Fullscreen backdrop overlay */}
      {isFullscreen && (
        <motion.div
          className="fixed inset-0 bg-gradient-to-b from-black/50 to-transparent z-[99] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
      <motion.div
        layout
        layoutId="playerBubble"
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
          scale: isExpanded || isFullscreen ? 1 : 0.95,
          opacity: 1,
        }}
        style={{ 
          willChange: "transform, opacity",
          transform: "translateZ(0)", // GPU acceleration
        }}
        transition={springTransition}
        onMouseEnter={(e) => {
          e.stopPropagation()
          handleInteraction()
        }}
        onMouseMove={(e) => {
          e.stopPropagation()
          // Throttle mouse move to prevent excessive calls (max once per 100ms)
          const now = Date.now()
          if (now - lastMouseMoveRef.current > 100) {
            lastMouseMoveRef.current = now
            handleInteraction()
          }
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (!isExpanded && !isFullscreen && !isMobile) {
            setIsExpanded(true)
          }
        }}
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
          className={`glass shadow-2xl overflow-hidden border border-white/10 backdrop-blur-[18px] bg-[rgba(15,15,25,0.6)] h-full ${
            isExpanded || isFullscreen ? "p-6" : "p-4"
          } hover:bg-[rgba(20,20,35,0.8)] hover:border-white/20 transition-all duration-300 flex flex-col ${
            isPlaying ? "ring-2 ring-purple-500/50" : ""
          }`}
          style={{
            boxShadow: isPlaying
              ? `0 0 15px rgba(168, 85, 247, 0.35), 0 0 ${20 + currentAmplitude * 60}px rgba(147, 51, 234, ${0.4 + currentAmplitude * 0.3}), 0 0 ${40 + currentAmplitude * 100}px rgba(34, 211, 238, ${0.2 + currentAmplitude * 0.2})`
              : `0 0 15px rgba(168, 85, 247, 0.35)`,
          }}
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
            <div className="flex items-center gap-2">
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
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation()
                setIsClosed(true)
              }}
            >
              <X className="w-5 h-5" />
            </Button>
            </div>
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
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsClosed(true)
                }}
                aria-label="Close player"
              >
                <X className="w-4 h-4" />
              </Button>
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
              transition={prefersReducedMotion 
                ? { duration: 0.1 }
                : { type: "spring", stiffness: 90, damping: 20 }
              }
              style={{ 
                willChange: "transform",
                transform: "translateZ(0)", // GPU acceleration
              }}
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
              <div className="relative lyrics-box bg-gradient-to-b from-[rgba(25,25,35,0.85)] to-[rgba(10,10,20,0.9)] text-[rgba(255,255,255,0.85)] p-4 rounded-xl max-h-[200px] overflow-y-auto border border-white/10">
                <style jsx>{`
                  .lyrics-box::-webkit-scrollbar {
                    width: 4px;
                  }
                  .lyrics-box::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                  }
                `}</style>
                <div className={`text-sm leading-relaxed scroll-smooth ${
                  isFullscreen ? "h-48 text-center" : "max-h-32"
                }`} style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.05)' }}>
                {isFullscreen && lyricsLines.length > 0 ? (
                  lyricsLines.map((line, i) => {
                    const isActive = i === currentLyricIndex
                    return (
                      <motion.p
                        key={i}
                        className={`py-2 transition-all font-[Inter] ${
                          isActive
                            ? "text-purple-300 font-semibold scale-105"
                            : "text-gray-400"
                        }`}
                        animate={{
                          opacity: isActive ? 1 : 0.4,
                          y: isActive ? 0 : 10,
                          scale: isActive ? 1.02 : 1,
                        }}
                        transition={{ 
                          duration: 0.3,
                          ease: "easeOut"
                        }}
                        style={{ 
                          willChange: "opacity, transform",
                          transform: "translateZ(0)",
                        }}
                      >
                        {line || "\u00A0"}
                      </motion.p>
                    )
                  })
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


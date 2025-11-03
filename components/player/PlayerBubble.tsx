"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { motion } from "framer-motion"
import WaveSurfer from "wavesurfer.js"
import { Pause, Play, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Minimize2, Maximize2 } from "lucide-react"

type Track = {
  id: string
  title: string
  artist: string
  coverUrl: string
  audioUrl: string
  lyrics?: string[]
  duration?: number
}

type Props = {
  track: Track | null
  queueNext: () => void
  queuePrev: () => void
  onMiniToggle?: (mini: boolean) => void
}

export default function PlayerBubble({ track, queueNext, queuePrev, onMiniToggle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setPlaying] = useState(false)
  const [isMini, setMini] = useState(true)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<"off" | "one" | "all">("off")
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [currentLyric, setCurrentLyric] = useState(0)

  // ---- build wavesurfer only once per track ----
  const waveOptions = useMemo(
    () => ({
      height: isMini ? 48 : 90,
      barWidth: 2,
      barGap: 2,
      normalize: true,
      barRadius: 2,
      interact: true,
      cursorWidth: 0,
      waveColor: "rgba(168, 85, 247, .35)",        // purple-500/35
      progressColor: "rgba(236, 72, 153, .8)",     // pink-500/80
      responsive: true,
      dragToSeek: true,
    }),
    [isMini]
  )

  // dedicated rAF loop to avoid React re-renders
  const startRaf = useCallback(() => {
    let raf = 0
    const tick = () => {
      if (wavesurferRef.current) {
        const ws = wavesurferRef.current
        const ct = ws.getCurrentTime()
        const dur = ws.getDuration() || 0
        setCurrentTime(ct)
        setDuration(dur)
        setProgress(dur ? (ct / dur) * 100 : 0)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!track || !containerRef.current) return

    // create <audio> shared element
    const audio = new Audio(track.audioUrl)
    audio.crossOrigin = "anonymous"
    audioRef.current = audio
    audio.volume = volume

    // wavesurfer bound to same audio element
    const ws = WaveSurfer.create({
      container: containerRef.current.querySelector("#wave-holder") as HTMLElement,
      backend: "MediaElement",
      media: audio,
      ...waveOptions,
    })

    wavesurferRef.current = ws
    const stopRaf = startRaf()

    ws.on("ready", () => {
      setDuration(ws.getDuration())
      setTimeout(() => setPlaying(true), 60) // small delay for smooth fade
    })

    ws.on("finish", () => {
      if (repeat === "one") {
        ws.seekTo(0)
        ws.play()
      } else {
        queueNext()
      }
    })

    // lyric line tick (very light)
    const lyricTimer = setInterval(() => {
      if (!track?.lyrics?.length) return
      const idx = Math.min(track.lyrics.length - 1, Math.floor((audio.currentTime / (audio.duration || 1)) * track.lyrics.length))
      setCurrentLyric(idx)
    }, 400)

    return () => {
      clearInterval(lyricTimer)
      stopRaf()
      ws.destroy()
      audio.pause()
      audio.src = ""
      audioRef.current = null
      wavesurferRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, waveOptions, repeat, queueNext, startRaf])

  // controls
  const togglePlay = useCallback(() => {
    const ws = wavesurferRef.current
    if (!ws) return
    if (ws.isPlaying()) {
      ws.pause()
      setPlaying(false)
    } else {
      ws.play()
      setPlaying(true)
    }
  }, [])

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    wavesurferRef.current?.seekTo(pct)
  }

  useEffect(() => { 
    if (audioRef.current) audioRef.current.volume = volume 
  }, [volume])

  const toggleMini = () => { 
    setMini(m => !m)
    onMiniToggle?.(isMini)
  }

  const repeatCycle = () => {
    setRepeat(r => (r === "off" ? "one" : r === "one" ? "all" : "off"))
  }

  const spring = { type: "spring", stiffness: 180, damping: 22 }

  if (!track) return null

  return (
    <motion.div
      layout
      layoutId="playerBubble"
      transition={spring}
      className={`fixed ${isMini ? "bottom-8 right-8 w-[380px]" : "inset-0 w-full h-full p-6"} z-50`}
      style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
    >
      {/* backdrop for fullscreen */}
      {!isMini && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(168,85,247,.25),rgba(13,13,19,.55))] pointer-events-none"
        />
      )}

      <motion.div
        layout
        transition={spring}
        className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <img src={track.coverUrl} alt="" className="h-9 w-9 rounded-md object-cover" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate text-white">{track.title}</div>
            <div className="text-xs text-white/60 truncate">{track.artist}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button 
              onClick={toggleMini} 
              className="p-1.5 rounded-md hover:bg-white/10 transition text-white/70 hover:text-white"
            >
              {isMini ? <Maximize2 size={16}/> : <Minimize2 size={16}/>}
            </button>
          </div>
        </div>

        {/* Wave + lyrics area (fullscreen shows both) */}
        <div className={`${isMini ? "px-4" : "grid grid-cols-2 gap-6 px-6 pt-4"}`}>
          <div className={`${isMini ? "" : "rounded-xl bg-white/5 p-4"} will-change-transform`}>
            <div id="wave-holder" ref={containerRef} className="w-full" />
          </div>

          {!isMini && (
            <div className="rounded-xl bg-white/5 p-4 h-[240px] overflow-y-auto relative">
              {/* gradient fades */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/30 to-transparent z-10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent z-10" />
              <div className="space-y-2 pr-2">
                {(track.lyrics || []).map((line, i) => (
                  <motion.p
                    key={i}
                    animate={{ 
                      opacity: i === currentLyric ? 1 : 0.45, 
                      y: i === currentLyric ? 0 : 4 
                    }}
                    transition={{ duration: 0.25 }}
                    className={`text-sm ${i === currentLyric ? "text-fuchsia-300 font-medium" : "text-white/70"}`}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className={`${isMini ? "px-4 pt-2" : "px-6 pt-4"}`}>
          <div 
            onClick={handleSeek} 
            className="h-1.5 bg-white/15 rounded-full overflow-hidden cursor-pointer"
          >
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500 transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-white/60 mt-1">
            <span>{format(currentTime)}</span>
            <span>{format(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className={`flex items-center justify-center gap-5 ${isMini ? "p-3" : "p-6"}`}>
          <button 
            aria-label="shuffle" 
            onClick={() => setShuffle(s => !s)} 
            className={`p-2 rounded-full hover:bg-white/10 transition ${shuffle ? "text-purple-400" : "text-white/70"}`}
          >
            <Shuffle size={18}/>
          </button>
          <button 
            onClick={queuePrev} 
            className="p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white"
          >
            <SkipBack size={18}/>
          </button>
          <button 
            onClick={togglePlay} 
            className="p-3 rounded-full bg-gradient-to-tr from-purple-500 to-fuchsia-500 text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            {isPlaying ? <Pause size={18}/> : <Play size={18}/>}
          </button>
          <button 
            onClick={queueNext} 
            className="p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white"
          >
            <SkipForward size={18}/>
          </button>
          <button 
            aria-label="repeat" 
            onClick={repeatCycle} 
            className={`p-2 rounded-full hover:bg-white/10 transition ${repeat !== "off" ? "text-purple-400" : "text-white/70"}`}
          >
            <Repeat size={18}/>
          </button>

          {/* volume */}
          <div className="ml-4 hidden sm:flex items-center gap-2 text-white/70">
            <Volume2 size={16}/>
            <input
              type="range" 
              min={0} 
              max={1} 
              step={0.01} 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-28 accent-fuchsia-500"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

const format = (s: number) => {
  if (!s || !isFinite(s)) return "0:00"
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60).toString().padStart(2, "0")
  return `${m}:${r}`
}


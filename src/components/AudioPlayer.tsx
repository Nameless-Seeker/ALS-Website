import React, { useEffect, useRef, useState } from "react"
import { Play, Pause, RotateCcw, Volume2, VolumeX, FastForward, Download, Sparkles, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AudioPlayerProps {
  audioFile?: File | null
  audioUrl?: string | null
  onClear?: () => void
  title?: string
  subtitle?: string
  autoPlay?: boolean
  downloadFileName?: string
  transcription?: string | null
  ttsAvailable?: boolean
  onPlayStart?: () => void
  onPlayEnd?: () => void
}

export function AudioPlayer({
  audioFile,
  audioUrl,
  onClear,
  title,
  subtitle,
  autoPlay = false,
  downloadFileName = "response.wav",
  transcription,
  ttsAvailable = true,
  onPlayStart,
  onPlayEnd,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [copied, setCopied] = useState(false)

  // Generate and manage object URL if an audioFile was provided
  useEffect(() => {
    if (audioUrl) {
      setObjectUrl(audioUrl)
      return
    }

    if (audioFile) {
      const url = URL.createObjectURL(audioFile)
      setObjectUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setObjectUrl(null)
    }
  }, [audioFile, audioUrl])

  // Setup HTML5 Audio element listeners & handle autoPlay
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setAutoplayBlocked(false)

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0)
      setCurrentTime(0)

      if (autoPlay) {
        audio.play().catch((err) => {
          console.warn("Autoplay prevented by browser:", err)
          setAutoplayBlocked(true)
        })
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onPlayEnd?.()
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setAutoplayBlocked(false)
      onPlayStart?.()
    }

    const handlePause = () => {
      setIsPlaying(false)
      onPlayEnd?.()
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [objectUrl, autoPlay, onPlayStart, onPlayEnd])

  // Update volume and playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
      audioRef.current.playbackRate = playbackRate
    }
  }, [volume, isMuted, playbackRate])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current
        .play()
        .then(() => setAutoplayBlocked(false))
        .catch((err) => {
          console.error("Playback error:", err)
          setAutoplayBlocked(true)
        })
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(console.error)
    }
  }

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1.0, 1.25, 1.5]
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length
    setPlaybackRate(rates[nextIndex])
  }

  const handleDownload = () => {
    if (!objectUrl) return
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = downloadFileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleCopyTranscription = async () => {
    if (!transcription) return
    try {
      await navigator.clipboard.writeText(transcription)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy transcription:", err)
    }
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00"
    const mins = Math.floor(secs / 60)
    const remainingSecs = Math.floor(secs % 60)
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`
  }

  const displayTitle = title || audioFile?.name || "Synthesized Audio Response"
  const displaySubtitle =
    subtitle ||
    (audioFile
      ? `${(audioFile.size / (1024 * 1024)).toFixed(2)} MB • ${(audioFile.name.split(".").pop() || "audio").toUpperCase()}`
      : "Audio Response • 16kHz WAV")

  const wordCount = transcription ? transcription.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = transcription ? transcription.length : 0

  // If no audio is available, or TTS is unavailable, but transcription exists
  if (!objectUrl || !ttsAvailable) {
    if (transcription !== undefined && transcription !== null) {
      return (
        <div className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {displayTitle}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>Recognized Speech</span>
                <span>•</span>
                <span>Whisper STT</span>
              </div>
            </div>
            {onClear && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
              >
                Remove
              </Button>
            )}
          </div>

          {/* Embedded Predicted Transcription Box */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-background/90 dark:bg-slate-950/80 border border-primary/25 space-y-2 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recognized Speech Transcription</span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyTranscription}
                disabled={!transcription}
                className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <p className="text-base sm:text-lg text-foreground font-medium tracking-wide leading-relaxed select-text">
                {transcription ? `"${transcription}"` : <span className="italic text-muted-foreground text-sm">No speech detected.</span>}
              </p>
            </div>

            {transcription && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                <span>{wordCount} words • {charCount} chars</span>
                <span className="font-mono text-[10px] opacity-80">Whisper TORGO Model</span>
              </div>
            )}
          </div>

          {/* Graceful TTS Unavailable Notice */}
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground">
            <VolumeX className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span>Speech generated, but audio playback is temporarily unavailable.</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Native HTML5 Audio Element */}
      <audio ref={audioRef} src={objectUrl} preload="auto" />

      {/* Autoplay Blocked Banner */}
      {autoplayBlocked && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Speech response ready</span>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={togglePlay}
            className="h-7 text-xs font-semibold px-3 gap-1 shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            Play Response
          </Button>
        </div>
      )}

      {/* Audio File Summary Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {displayTitle}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{displaySubtitle}</span>
            <span>•</span>
            <span>HTML5 Audio</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            title="Download audio"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>

          {onClear && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Embedded Predicted Transcription Box */}
      {transcription !== undefined && transcription !== null && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-background/90 dark:bg-slate-950/80 border border-primary/25 space-y-2 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Predicted Transcription</span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyTranscription}
              disabled={!transcription}
              className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <p className="text-base sm:text-lg text-foreground font-medium tracking-wide leading-relaxed select-text">
              {transcription ? `"${transcription}"` : <span className="italic text-muted-foreground text-sm">No speech detected.</span>}
            </p>
          </div>

          {transcription && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
              <span>{wordCount} words • {charCount} chars</span>
              <span className="font-mono text-[10px] opacity-80">Whisper TORGO Model</span>
            </div>
          )}
        </div>
      )}

      {/* Progress & Scrubber */}
      <div className="space-y-1.5">
        <div className="relative group flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek audio"
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary group-hover:h-2.5 transition-all"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls Toolbar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={togglePlay}
            className="h-9 px-3 gap-1.5 font-medium rounded-lg shadow-sm"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play</span>
              </>
            )}
          </Button>

          {/* Restart Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRestart}
            title="Restart playback"
            className="h-9 w-9"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          {/* Speed Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cyclePlaybackRate}
            className="h-9 px-2 text-xs font-mono gap-1"
            title="Adjust speed"
          >
            <FastForward className="w-3 h-3" />
            <span>{playbackRate}x</span>
          </Button>
        </div>

        {/* Volume controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value))
              if (isMuted) setIsMuted(false)
            }}
            aria-label="Volume control"
            className="w-16 sm:w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>
    </div>
  )
}

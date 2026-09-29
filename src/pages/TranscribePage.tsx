import { useState, useEffect, useRef } from "react"
import { AudioUploader } from "@/components/AudioUploader"
import { AudioPlayer } from "@/components/AudioPlayer"
import { transcribeAudio } from "@/services/api"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Mic,
  Loader2,
  AlertTriangle,
  History,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Volume2,
  RefreshCw,
} from "lucide-react"

interface TranscriptionItem {
  id: string
  fileName: string
  fileSize: number
  responseSize: number
  text?: string
  timestamp: string
}

const STORAGE_KEY = "als_transcriptions_history"

export function TranscribePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "playing" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [responseAudioUrl, setResponseAudioUrl] = useState<string | null>(null)
  const [transcriptionText, setTranscriptionText] = useState<string | null>(null)
  const [ttsAvailable, setTtsAvailable] = useState<boolean>(true)
  const [progress, setProgress] = useState(0)
  const [history, setHistory] = useState<TranscriptionItem[]>([])

  const responseAudioUrlRef = useRef<string | null>(null)

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load history:", e)
    }
  }, [])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (responseAudioUrlRef.current) {
        URL.revokeObjectURL(responseAudioUrlRef.current)
      }
    }
  }, [])

  // Save history to localStorage
  const saveToHistory = (item: TranscriptionItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev.filter((h) => h.id !== item.id)].slice(0, 10)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error("Failed to save history:", e)
      }
      return updated
    })
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const revokeCurrentResponseUrl = () => {
    if (responseAudioUrlRef.current) {
      URL.revokeObjectURL(responseAudioUrlRef.current)
      responseAudioUrlRef.current = null
    }
    setResponseAudioUrl(null)
  }

  const handleAudioSelected = (file: File) => {
    revokeCurrentResponseUrl()
    setSelectedFile(file)
    setStatus("idle")
    setErrorMessage(null)
    setTranscriptionText(null)
    setTtsAvailable(true)
    setProgress(0)
  }

  const handleClearSelected = () => {
    revokeCurrentResponseUrl()
    setSelectedFile(null)
    setStatus("idle")
    setErrorMessage(null)
    setTranscriptionText(null)
    setTtsAvailable(true)
    setProgress(0)
  }

  const handleTranscribe = async () => {
    if (!selectedFile) return

    setStatus("uploading")
    setErrorMessage(null)
    setProgress(20)

    // Revoke any previous audio response URL before new transcription
    revokeCurrentResponseUrl()

    // Smooth progress simulation matching backend stages
    const timer1 = setTimeout(() => {
      setProgress(55)
      setStatus("processing")
    }, 400)

    const timer2 = setTimeout(() => {
      setProgress(85)
    }, 1200)

    try {
      // Backend returns audio/wav binary stream and predicted text in X-Transcription header!
      const { audioBlob, transcription, ttsAvailable: isTtsAvailable } = await transcribeAudio(selectedFile)
      clearTimeout(timer1)
      clearTimeout(timer2)
      setProgress(100)

      setTranscriptionText(transcription)
      setTtsAvailable(isTtsAvailable)

      // Only attempt to play/create an audio URL when:
      // ttsAvailable === true && audioBlob.size > 0
      if (isTtsAvailable && audioBlob.size > 0) {
        const audioUrl = URL.createObjectURL(audioBlob)
        responseAudioUrlRef.current = audioUrl
        setResponseAudioUrl(audioUrl)
        setStatus("playing")
      } else {
        // Whisper transcription succeeded, but TTS audio playback is unavailable.
        // Do not attempt to play an empty Blob.
        revokeCurrentResponseUrl()
        setStatus("idle")
      }

      // Add to history
      saveToHistory({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        responseSize: isTtsAvailable ? audioBlob.size : 0,
        text: transcription,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })
    } catch (err: unknown) {
      // Genuine HTTP / network failure
      clearTimeout(timer1)
      clearTimeout(timer2)
      setStatus("error")
      setProgress(0)
      const message = err instanceof Error ? err.message : "Unable to process the audio. Please try again."
      setErrorMessage(message)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const isBusy = status === "uploading" || status === "processing"

  return (
    <div className="container max-w-5xl py-8 sm:py-12 px-4 sm:px-8 space-y-8">
      {/* Hero Section */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Whisper STT → Piper TTS Voice Pipeline</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          ALS Speech Synthesis &amp; Transcription
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
          Upload dysarthric speech audio to convert it into clear, intelligible synthesized voice output
          and view the predicted transcription text.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Work Area (Left / Center) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="shadow-sm border-border/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                Input Speech Audio
              </CardTitle>
              <CardDescription>
                Upload an audio file (.wav, .mp3, .ogg, .m4a) to process through the voice pipeline.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Uploader Box */}
              {!selectedFile ? (
                <AudioUploader
                  onAudioSelected={handleAudioSelected}
                  disabled={isBusy}
                />
              ) : (
                <div className="space-y-4">
                  {/* Native HTML5 Audio Player for source file */}
                  <AudioPlayer
                    audioFile={selectedFile}
                    onClear={isBusy ? undefined : handleClearSelected}
                  />

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelected}
                      disabled={isBusy}
                    >
                      Change Audio File
                    </Button>

                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      onClick={handleTranscribe}
                      disabled={isBusy}
                      className="gap-2 shadow-sm font-semibold"
                    >
                      {status === "uploading" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : status === "processing" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                          <span>Processing speech...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Synthesize Speech</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Progress Bar while uploading / processing speech */}
              {isBusy && (
                <div className="space-y-2 pt-2 animate-in fade-in">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>
                      {status === "uploading"
                        ? "Uploading..."
                        : "Processing speech..."}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Error Message for genuine non-2xx failure */}
              {status === "error" && errorMessage && (
                <Alert variant="destructive" className="animate-in fade-in">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Operation Failed</AlertTitle>
                  <AlertDescription className="mt-1 space-y-1">
                    <p>{errorMessage}</p>
                    <p className="text-xs opacity-90 mt-2 text-muted-foreground">
                      Please verify your internet connection and try again.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Synthesized Audio Response & Transcription Card */}
          {(responseAudioUrl || transcriptionText) && (
            <Card className="border-emerald-500/30 bg-card shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {ttsAvailable ? <Volume2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        Speech Recognition &amp; Synthesis
                        <Badge variant={ttsAvailable ? "success" : "secondary"}>
                          {status === "playing"
                            ? "Playing response..."
                            : ttsAvailable
                            ? "Transcription complete"
                            : "Audio playback unavailable"}
                        </Badge>
                      </CardTitle>
                      {selectedFile && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Synthesized from: <span className="font-mono">{selectedFile.name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelected}
                    className="gap-1.5 h-8 text-xs font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Upload Another</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                <AudioPlayer
                  audioUrl={responseAudioUrl}
                  autoPlay={true}
                  transcription={transcriptionText}
                  ttsAvailable={ttsAvailable}
                  title={`Voice Response for ${selectedFile?.name || "Speech Audio"}`}
                  subtitle={ttsAvailable ? "Whisper STT → Piper TTS Synthesized Output • 16kHz WAV" : "Whisper STT Output"}
                  downloadFileName={`synthesized-${selectedFile?.name.replace(/\.[^/.]+$/, "") || "speech"}.wav`}
                  onPlayStart={() => setStatus("playing")}
                  onPlayEnd={() => setStatus("idle")}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: History & Guidelines */}
        <div className="lg:col-span-4 space-y-6">
          {/* History Card */}
          <Card className="shadow-sm border-border/80">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  Recent Voice Syntheses
                </CardTitle>
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {history.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No syntheses yet in this session. Completed requests will appear here.
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="font-medium text-foreground truncate max-w-[170px]" title={item.fileName}>
                          {item.fileName}
                        </span>
                        <span className="text-[11px] font-mono">{item.timestamp}</span>
                      </div>
                      {item.text && (
                        <p className="text-foreground/90 font-sans line-clamp-2 italic bg-background/50 p-1.5 rounded border border-border/30">
                          "{item.text}"
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Input: {formatBytes(item.fileSize)}</span>
                        <span>Output: {item.responseSize > 0 ? `${formatBytes(item.responseSize)} WAV` : "TTS unavailable"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info & Tips */}
          <Card className="shadow-sm border-border/80 bg-slate-50/50 dark:bg-slate-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Pipeline Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <ul className="list-disc list-inside space-y-1.5">
                <li>Input dysarthric speech is transcribed using fine-tuned Whisper.</li>
                <li>Clear synthesized speech is generated for natural communication.</li>
                <li>Optimized acoustic features for altered speech patterns.</li>
                <li>Whisper speech recognition operates reliably across voice profiles.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { useLiveTalkRecorder } from "@/hooks/useLiveTalkRecorder"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AudioPlayer } from "@/components/AudioPlayer"
import {
  Mic,
  Square,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  HardDrive,
  Info,
  Loader2,
  Sparkles,
  Volume2,
} from "lucide-react"

export function LiveTalkPage() {
  const {
    state,
    isRecording,
    isProcessing,
    isPlaying,
    transcription,
    ttsAvailable,
    errorMessage,
    audioLevel,
    recordingDuration,
    lastBlobInfo,
    recordedAudioUrl,
    responseAudioUrl,
    responseBlobInfo,
    toggleRecording,
    handlePlayStart,
    handlePlayEnd,
    resetError,
  } = useLiveTalkRecorder()

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="container max-w-5xl py-8 sm:py-12 px-4 sm:px-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-1 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Live Talk &bull; Whisper STT → Piper TTS Voice Pipeline</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Live Talk Microphone
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-3xl">
          Tap the microphone to speak, then tap again to stop. Your speech is converted to clear, synthesized audio
          and played back automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Work Area (Left Column) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Recording Control Card */}
          <Card
            className={`shadow-md border-2 transition-all ${
              isRecording
                ? "border-red-500/80 bg-red-500/[0.03] shadow-red-500/10"
                : isProcessing
                ? "border-amber-500/80 bg-amber-500/[0.03]"
                : isPlaying
                ? "border-emerald-500/80 bg-emerald-500/[0.03]"
                : "border-border/80"
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Mic className={`w-5 h-5 ${isRecording ? "text-red-500 animate-pulse" : isPlaying ? "text-emerald-500 animate-pulse" : "text-primary"}`} />
                  Microphone Capture
                </CardTitle>

                {/* State Badges */}
                {isRecording && (
                  <Badge variant="destructive" className="gap-1.5 py-1 px-3 bg-red-600 hover:bg-red-700 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-white" />
                    <span>Listening...</span>
                  </Badge>
                )}

                {isProcessing && (
                  <Badge variant="warning" className="gap-1.5 py-1 px-3 bg-amber-500 hover:bg-amber-600 text-white animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </Badge>
                )}

                {isPlaying && (
                  <Badge variant="success" className="gap-1.5 py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse">
                    <Volume2 className="h-3.5 w-3.5 animate-bounce" />
                    <span>Playing response...</span>
                  </Badge>
                )}

                {state === "idle" && (
                  <Badge variant="secondary" className="gap-1.5 py-1 px-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Tap to speak</span>
                  </Badge>
                )}

                {state === "error" && (
                  <Badge variant="destructive" className="gap-1.5 py-1 px-3">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Error</span>
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Dysarthric speech recognition and synthesized voice output
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Alert */}
              {errorMessage && (
                <Alert variant="destructive" className="animate-in fade-in">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Operation Error</AlertTitle>
                  <AlertDescription className="text-xs space-y-1">
                    <p>{errorMessage}</p>
                    <div className="pt-1 flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={resetError} className="h-7 text-xs bg-background">
                        Dismiss
                      </Button>
                      <span className="text-[11px] opacity-80">
                        Please check your network connection and ensure microphone permissions are granted.
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Dynamic Instruction Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                  isRecording
                    ? "bg-red-50 dark:bg-red-950/30 border-red-500/40 text-red-800 dark:text-red-300"
                    : isProcessing
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500/40 text-amber-800 dark:text-amber-300"
                    : isPlaying
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                    : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isRecording ? (
                    <div className="h-3.5 w-3.5 rounded-full bg-red-600 animate-ping" />
                  ) : isProcessing ? (
                    <Loader2 className="h-4 w-4 text-amber-600 animate-spin shrink-0" />
                  ) : isPlaying ? (
                    <Volume2 className="h-4 w-4 text-emerald-600 animate-pulse shrink-0" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {isRecording
                        ? "Listening..."
                        : isProcessing
                        ? "Processing..."
                        : isPlaying
                        ? "Playing response..."
                        : "Tap to speak"}
                    </p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      {isRecording
                        ? "Speak naturally into your microphone. Tap again when finished to synthesize."
                        : isProcessing
                        ? "Processing your speech and generating voice response..."
                        : isPlaying
                        ? "Playing synthesized speech response. Tap button below anytime to speak again."
                        : "Tap the button below to start speaking."}
                    </p>
                  </div>
                </div>

                {isRecording && (
                  <div className="text-right shrink-0">
                    <span className="font-mono text-base font-bold text-red-600 dark:text-red-400">
                      {formatDuration(recordingDuration)}
                    </span>
                  </div>
                )}
              </div>

              {/* Real-time Microphone Input Level Gauge */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    Microphone Audio Level
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {isRecording ? `${audioLevel}%` : "Inactive"}
                  </span>
                </div>
                <Progress
                  value={isRecording ? audioLevel : 0}
                  className="h-2.5 bg-slate-200 dark:bg-slate-800"
                  indicatorClassName={`transition-all duration-75 ${
                    audioLevel > 60
                      ? "bg-red-500"
                      : audioLevel > 15
                      ? "bg-emerald-500"
                      : "bg-primary"
                  }`}
                />
              </div>

              {/* Single Microphone Control Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={`w-full h-16 text-lg font-bold gap-3 shadow-lg active:scale-[0.99] transition-all rounded-xl ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 animate-pulse text-white"
                      : isPlaying
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <Square className="w-6 h-6 fill-current" />
                      <span>Listening... (Tap to stop &amp; synthesize)</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <Volume2 className="w-6 h-6 animate-pulse" />
                      <span>Playing response... (Tap to speak again)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-6 h-6" />
                      <span>Tap to speak</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Audio Playback of Recorded Input Preview */}
              {recordedAudioUrl && !isRecording && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">Recorded Input Preview</span>
                    {lastBlobInfo && (
                      <span className="font-mono">
                        {formatBytes(lastBlobInfo.size)} &bull; {lastBlobInfo.mimeType}
                      </span>
                    )}
                  </div>
                  <AudioPlayer audioFile={null} audioUrl={recordedAudioUrl} title="Recorded Input Audio" subtitle="Captured Microphone Audio" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Synthesized Speech Output & Transcription Card */}
          {(responseAudioUrl || transcription) && (
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
                          {isPlaying
                            ? "Playing response..."
                            : ttsAvailable
                            ? "Transcription complete"
                            : "Audio playback unavailable"}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Engine: <span>{ttsAvailable ? "Whisper STT • Piper TTS" : "Whisper STT"}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                <AudioPlayer
                  audioUrl={responseAudioUrl}
                  autoPlay={true}
                  transcription={transcription}
                  ttsAvailable={ttsAvailable}
                  title="Synthesized Speech Response"
                  subtitle={ttsAvailable ? "Whisper STT → Piper TTS Synthesized Output • 16kHz WAV" : "Whisper STT Output"}
                  downloadFileName="synthesized-live-response.wav"
                  onPlayStart={handlePlayStart}
                  onPlayEnd={handlePlayEnd}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Column (Right Column) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Session Metrics Card */}
          <Card className="shadow-sm border-border/80">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Session Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Recording Duration
                </span>
                <span className="font-mono font-bold text-foreground">
                  {formatDuration(recordingDuration)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <HardDrive className="w-3.5 h-3.5" />
                  Captured Input
                </span>
                <span className="font-mono font-bold text-foreground">
                  {lastBlobInfo ? formatBytes(lastBlobInfo.size) : "0 B"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Synthesized Output
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {ttsAvailable && responseBlobInfo ? `${formatBytes(responseBlobInfo.size)} WAV` : !ttsAvailable ? "Unavailable" : "Ready"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Highlights Card */}
          <Card className="shadow-sm border-border/80 bg-slate-50/50 dark:bg-slate-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                <Info className="w-4 h-4 text-primary" />
                Pipeline Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong>Push-to-Talk:</strong> Tap to record speech and tap again to stop and synthesize.</li>
                <li><strong>TORGO Fine-Tuned:</strong> Acoustic weights tailored specifically for altered dysarthric speech patterns.</li>
                <li><strong>Real-time Gauge:</strong> Responsive visual level meter monitors microphone input.</li>
                <li><strong>Continuous Repeatability:</strong> Record, listen to synthesized response, and speak again seamlessly.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

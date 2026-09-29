import { Cpu, ShieldCheck, MessageSquare, AudioLines, Sparkles, Mic } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AboutPage() {
  return (
    <div className="container max-w-4xl py-8 sm:py-12 px-4 sm:px-8 space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">About ALS Speech Assist</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          An automated speech recognition system specifically trained and fine-tuned for individuals living with
          Amyotrophic Lateral Sclerosis (ALS) and dysarthria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              Machine Learning Model
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Based on OpenAI's <strong>Whisper-small</strong> architecture, fine-tuned on the <strong>TORGO database</strong> of
              dysarthric speech.
            </p>
            <p>
              Dysarthric speech exhibits altered phoneme durations, reduced vowel space, and atypical acoustic features.
              Our model adapts acoustic weights specifically to overcome these recognition challenges.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Architecture &amp; Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              The platform communicates securely with the automated speech recognition engine using modern web standards.
            </p>
            <p>
              Audio recordings are processed directly by the dedicated model instance, preserving user voice privacy.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Architecture */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Core Pipeline Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-primary" />
                Speech Recognition (ASR)
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Fine-tuned Whisper model converts atypical dysarthric speech patterns into accurate, readable text.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <AudioLines className="w-4 h-4 text-primary" />
                Voice Synthesis (TTS)
              </span>
              <p className="text-muted-foreground leading-relaxed">
                High-fidelity neural voice synthesis reads recognized speech aloud with natural pacing and clarity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap / Coming soon */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Project Roadmap</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AudioLines className="w-5 h-5 text-primary" />
                <Badge variant="success">Active</Badge>
              </div>
              <CardTitle className="text-sm font-semibold">Audio Upload Transcription</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Audio file upload with native HTML5 playback, predicted text recognition, and synthesized voice.
            </CardContent>
          </Card>

          <Card className="border-emerald-500/40 bg-emerald-500/5">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Mic className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <Badge variant="success">Active</Badge>
              </div>
              <CardTitle className="text-sm font-semibold">Live Talk Microphone</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Single-button push-to-talk recording with speech recognition and instant synthesized voice response.
            </CardContent>
          </Card>

          <Card className="opacity-80">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <Badge variant="secondary">Phase 3</Badge>
              </div>
              <CardTitle className="text-sm font-semibold">Conversational Assist</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Contextual phrase suggestions and conversational assistance for natural two-way communication.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

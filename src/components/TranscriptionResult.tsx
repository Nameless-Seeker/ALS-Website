import { useState } from "react"
import { Copy, Check, Download, Sparkles, RefreshCw } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TranscriptionResultProps {
  transcription: string
  audioFileName?: string
  onReset: () => void
}

export function TranscriptionResult({
  transcription,
  audioFileName,
  onReset,
}: TranscriptionResultProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcription)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([transcription], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `transcription-${audioFileName ? audioFileName.replace(/\.[^/.]+$/, "") : "result"}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const wordCount = transcription.trim() ? transcription.trim().split(/\s+/).length : 0
  const charCount = transcription.length

  return (
    <Card className="border-emerald-500/30 bg-card shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Predicted Transcription
                <Badge variant="success">Completed</Badge>
              </CardTitle>
              {audioFileName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Source: <span className="font-mono">{audioFileName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 p-5 border border-slate-200/80 dark:border-slate-800">
          <p className="text-lg leading-relaxed text-foreground tracking-wide font-medium whitespace-pre-wrap select-text">
            {transcription || <span className="italic text-muted-foreground">No speech detected in audio.</span>}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 px-1">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} characters</span>
          </div>
          <span className="text-[11px] font-mono opacity-80">Whisper TORGO fine-tuned model</span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-5 border-t border-border/40 flex justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onReset}
          className="gap-1.5 text-xs font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Transcribe Another File
        </Button>
      </CardFooter>
    </Card>
  )
}

import React, { useRef, useState } from "react"
import { UploadCloud, Music, FileAudio, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AudioUploaderProps {
  onAudioSelected: (file: File) => void
  disabled?: boolean
}

const SUPPORTED_EXTENSIONS = [".wav", ".mp3", ".ogg", ".m4a", ".flac", ".aac", ".webm"]
const MAX_FILE_SIZE_MB = 50 // 50MB reasonable cap for speech recordings

export function AudioUploader({ onAudioSelected, disabled }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const validateAndSelectFile = (file: File) => {
    setErrorMessage(null)

    // Check file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File is too large. Please upload an audio file under ${MAX_FILE_SIZE_MB}MB.`)
      return
    }

    // Check if audio file
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`
    const isAudioType = file.type.startsWith("audio/") || SUPPORTED_EXTENSIONS.includes(fileExt)

    if (!isAudioType) {
      setErrorMessage("Please select a valid audio file (e.g. WAV, MP3, M4A, OGG).")
      return
    }

    onAudioSelected(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      validateAndSelectFile(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      validateAndSelectFile(file)
      // Reset input value so re-selecting the same file triggers change
      e.target.value = ""
    }
  }

  return (
    <div className="w-full space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`group relative border-2 border-dashed rounded-2xl p-8 sm:p-10 transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
          disabled
            ? "opacity-50 pointer-events-none border-muted"
            : isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-slate-300 dark:border-slate-800 hover:border-primary/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 bg-card"
        }`}
      >
        {/* Hidden native HTML file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.wav,.mp3,.ogg,.m4a,.flac,.aac,.webm"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          aria-label="Upload audio file"
        />

        <div className="p-4 rounded-2xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
          {isDragging ? (
            <FileAudio className="w-8 h-8 text-primary animate-bounce" />
          ) : (
            <UploadCloud className="w-8 h-8 text-primary" />
          )}
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-1">
          {isDragging ? "Drop your audio file here" : "Upload speech audio"}
        </h3>

        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          Drag and drop your audio recording, or click to browse. Supports dysarthric & ALS speech samples.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            disabled={disabled}
            className="gap-2 font-medium"
          >
            <Music className="w-4 h-4" />
            Select Audio File
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/80 mt-2 font-mono">
          WAV, MP3, M4A, OGG, FLAC, WEBM • Up to 50MB
        </p>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}

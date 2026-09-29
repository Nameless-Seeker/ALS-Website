import { useState, useRef, useCallback, useEffect } from "react"
import { transcribeAudio } from "@/services/api"

export type LiveTalkRecorderState = "idle" | "recording" | "processing" | "playing" | "error"

export interface LiveTalkLogEntry {
  id: string
  timestamp: string
  type: "start" | "stop" | "blob" | "request" | "response" | "playing" | "error" | "info"
  message: string
}

function getSupportedMimeType(): string {
  if (typeof window === "undefined" || !("MediaRecorder" in window)) {
    return ""
  }
  const candidateTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ]
  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return ""
}

export function useLiveTalkRecorder() {
  const [state, setState] = useState<LiveTalkRecorderState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [recordingDuration, setRecordingDuration] = useState<number>(0)
  const [lastBlobInfo, setLastBlobInfo] = useState<{ size: number; mimeType: string } | null>(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [responseAudioUrl, setResponseAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string | null>(null)
  const [ttsAvailable, setTtsAvailable] = useState<boolean>(true)
  const [responseBlobInfo, setResponseBlobInfo] = useState<{ size: number; mimeType: string } | null>(null)
  const [logs, setLogs] = useState<LiveTalkLogEntry[]>([])

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef<LiveTalkRecorderState>("idle")

  // Refs for tracking object URLs to avoid memory leaks
  const recordedAudioUrlRef = useRef<string | null>(null)
  const responseAudioUrlRef = useRef<string | null>(null)

  const addLog = useCallback((type: LiveTalkLogEntry["type"], message: string) => {
    const entry: LiveTalkLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      type,
      message,
    }
    setLogs((prev) => [entry, ...prev].slice(0, 100))
  }, [])

  const cleanupAudioAnalyser = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    setAudioLevel(0)

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch(() => {})
        }
      } catch {
        // ignore
      }
      audioContextRef.current = null
      analyserRef.current = null
    }
  }, [])

  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return

      const audioCtx = new AudioCtx()
      audioContextRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.5
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLevel = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        const normalized = Math.min(100, Math.round((avg / 128) * 100))
        setAudioLevel(normalized)
        animFrameRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()
    } catch (err) {
      console.warn("Could not setup audio visualizer:", err)
    }
  }, [])

  // Start recording (First click / Tap to speak)
  const startRecording = useCallback(async () => {
    if (stateRef.current === "recording" || stateRef.current === "processing") return

    setErrorMessage(null)
    chunksRef.current = []
    setRecordingDuration(0)

    try {
      console.log("[LiveTalk] Recording start: requesting microphone permission")
      addLog("info", "Requesting microphone permission...")

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      mediaStreamRef.current = stream

      const mimeType = getSupportedMimeType()
      const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const recorder = new MediaRecorder(stream, recorderOptions)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = (e) => {
        console.error("[LiveTalk] MediaRecorder error:", e)
        addLog("error", "MediaRecorder encountered an error")
        setErrorMessage("Microphone recording error occurred.")
        setState("error")
        stateRef.current = "error"
        cleanupAudioAnalyser()
      }

      // Start collecting chunks locally without sending anything
      recorder.start()
      stateRef.current = "recording"
      setState("recording")

      console.log("[LiveTalk] Listening... (MediaRecorder active)")
      addLog("start", `Listening started using ${recorder.mimeType || "default audio format"}`)

      setupAudioAnalyser(stream)

      // Start duration stopwatch
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } catch (err) {
      console.error("[LiveTalk] Failed to start recording:", err)
      let desc = "Failed to access microphone."
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          desc = "Microphone access was denied. Please allow microphone permissions."
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          desc = "No microphone was found on this computer."
        }
      }
      setErrorMessage(desc)
      addLog("error", desc)
      setState("error")
      stateRef.current = "error"
      cleanupAudioAnalyser()
    }
  }, [addLog, setupAudioAnalyser, cleanupAudioAnalyser])

  // Stop recording, combine Blob, and send to POST /transcribe (Second click)
  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || stateRef.current !== "recording") return

    console.log("[LiveTalk] Recording stop")
    addLog("stop", "Recording stopped. Assembling audio Blob...")

    stateRef.current = "processing"
    setState("processing")
    cleanupAudioAnalyser()

    recorder.onstop = async () => {
      // 1. Release microphone tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch {
            // ignore
          }
        })
        mediaStreamRef.current = null
      }

      // 2. Combine all collected chunks into ONE complete audio Blob
      const mimeType = recorder.mimeType || "audio/webm"
      const completeBlob = new Blob(chunksRef.current, { type: mimeType })

      console.log(`[LiveTalk] Blob MIME type: ${completeBlob.type}`)
      console.log(`[LiveTalk] Blob size: ${completeBlob.size} bytes`)

      addLog("blob", `Combined input audio Blob: ${completeBlob.size} bytes (${completeBlob.type})`)
      setLastBlobInfo({ size: completeBlob.size, mimeType: completeBlob.type })

      // Revoke previous recorded audio URL and create a fresh one
      if (recordedAudioUrlRef.current) {
        URL.revokeObjectURL(recordedAudioUrlRef.current)
        recordedAudioUrlRef.current = null
      }
      try {
        const previewUrl = URL.createObjectURL(completeBlob)
        recordedAudioUrlRef.current = previewUrl
        setRecordedAudioUrl(previewUrl)
      } catch {
        // ignore
      }

      // 3. Send to POST /transcribe using FormData
      try {
        console.log("[LiveTalk] Request started: sending POST /transcribe with audio: UploadFile")
        addLog("request", "Sending audio Blob to POST /transcribe...")

        // Backend returns audio/wav binary stream, X-Transcription, and X-TTS-Available headers!
        const result = await transcribeAudio(completeBlob, "recording.webm")

        console.log(
          `[LiveTalk] Response: transcription="${result.transcription}", ttsAvailable=${result.ttsAvailable}, audioSize=${result.audioBlob.size} bytes`
        )
        addLog("response", `Transcription: "${result.transcription || "(none)"}"`)

        setTranscription(result.transcription)
        setTtsAvailable(result.ttsAvailable)

        // Only create audio URL and attempt playback when TTS is available and audio is present
        if (result.ttsAvailable && result.audioBlob.size > 0) {
          setResponseBlobInfo({
            size: result.audioBlob.size,
            mimeType: result.audioBlob.type || "audio/wav",
          })

          // Revoke previous response audio URL and create a new object URL
          if (responseAudioUrlRef.current) {
            URL.revokeObjectURL(responseAudioUrlRef.current)
            responseAudioUrlRef.current = null
          }
          const audioUrl = URL.createObjectURL(result.audioBlob)
          responseAudioUrlRef.current = audioUrl
          setResponseAudioUrl(audioUrl)

          stateRef.current = "playing"
          setState("playing")
          addLog("playing", "Synthesized speech response ready (Whisper → Piper TTS)")
        } else {
          // TTS is unavailable or empty body: Whisper transcription was successful, do not treat as error!
          if (responseAudioUrlRef.current) {
            URL.revokeObjectURL(responseAudioUrlRef.current)
            responseAudioUrlRef.current = null
          }
          setResponseAudioUrl(null)
          setResponseBlobInfo(null)

          stateRef.current = "idle"
          setState("idle")
          addLog("info", "Speech generated, but audio playback is temporarily unavailable.")
        }
      } catch (err) {
        // Genuine request / network failure
        const msg = err instanceof Error ? err.message : "Unable to process the audio. Please try again."
        console.error("[LiveTalk] Transcription request error:", err)
        addLog("error", `Request failed: ${msg}`)
        setErrorMessage(msg)
        stateRef.current = "error"
        setState("error")
      } finally {
        chunksRef.current = []
        mediaRecorderRef.current = null
      }
    }

    try {
      recorder.stop()
    } catch (e) {
      console.warn("Error calling recorder.stop():", e)
    }
  }, [addLog, cleanupAudioAnalyser])

  // Single Microphone Button Toggle:
  // idle / playing / error -> startRecording()
  // recording -> stopRecording()
  const toggleRecording = useCallback(() => {
    if (stateRef.current === "recording") {
      stopRecording()
    } else if (stateRef.current !== "processing") {
      startRecording()
    }
  }, [startRecording, stopRecording])

  const handlePlayStart = useCallback(() => {
    setState("playing")
    stateRef.current = "playing"
  }, [])

  const handlePlayEnd = useCallback(() => {
    if (stateRef.current === "playing") {
      setState("idle")
      stateRef.current = "idle"
    }
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  const resetError = useCallback(() => {
    setErrorMessage(null)
    stateRef.current = "idle"
    setState("idle")
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioAnalyser()
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recordedAudioUrlRef.current) {
        URL.revokeObjectURL(recordedAudioUrlRef.current)
      }
      if (responseAudioUrlRef.current) {
        URL.revokeObjectURL(responseAudioUrlRef.current)
      }
    }
  }, [cleanupAudioAnalyser])

  return {
    state,
    isRecording: state === "recording",
    isProcessing: state === "processing",
    isPlaying: state === "playing",
    transcription,
    ttsAvailable,
    errorMessage,
    audioLevel,
    recordingDuration,
    lastBlobInfo,
    recordedAudioUrl,
    responseAudioUrl,
    responseBlobInfo,
    logs,
    toggleRecording,
    handlePlayStart,
    handlePlayEnd,
    clearLogs,
    resetError,
  }
}

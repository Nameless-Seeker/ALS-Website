export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || '/api'

export interface HealthResponse {
  status: string
  model?: string
}

export interface TranscribeResponse {
  audioBlob: Blob
  transcription: string
  ttsAvailable: boolean
}

/**
 * Checks the status of the FastAPI backend.
 */
export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Uploads an audio file or Blob to POST /transcribe using FormData and the Fetch API.
 * The backend FastAPI returns:
 * - Header X-Transcription: Whisper predicted text
 * - Header X-TTS-Available: "true" | "false"
 * - Response body: audio/wav when TTS available, or empty Blob when TTS unavailable
 */
export async function transcribeAudio(
  file: File | Blob,
  filename?: string
): Promise<TranscribeResponse> {
  const formData = new FormData()
  const finalFilename = filename || (file instanceof File ? file.name : 'recording.webm')
  formData.append('audio', file, finalFilename)

  console.log(`[HTTP /transcribe] Request started for: ${finalFilename} (${file.size} bytes, type: ${file.type || 'audio/webm'})`)

  const response = await fetch(`${API_BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData,
    // Note: Do NOT set Content-Type header manually when sending FormData,
    // the browser automatically sets multipart/form-data with the boundary.
  })

  if (!response.ok) {
    let errorMessage = `Server responded with ${response.status}: ${response.statusText}`
    try {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson?.detail) {
          errorMessage = typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail)
        } else if (errorJson?.message) {
          errorMessage = errorJson.message
        }
      } catch {
        if (errorText) {
          errorMessage = errorText
        }
      }
    } catch {
      // response wasn't text/json
    }
    throw new Error(errorMessage)
  }

  // 1. Read the transcription
  let transcription =
    response.headers.get('X-Transcription') ||
    response.headers.get('x-transcription') ||
    ''

  try {
    if (transcription.includes('%')) {
      transcription = decodeURIComponent(transcription)
    }
  } catch {
    // keep original string if decode fails
  }

  // 2. Read TTS availability
  const ttsHeader =
    response.headers.get('X-TTS-Available') ||
    response.headers.get('x-tts-available')
  const ttsAvailable = ttsHeader === 'true'

  // 3. Read response body as a Blob
  const audioBlob: Blob = await response.blob()

  console.log(
    `[HTTP /transcribe] Response received: transcription="${transcription}", ttsAvailable=${ttsAvailable}, audioSize=${audioBlob.size} bytes`
  )

  return {
    audioBlob,
    transcription,
    ttsAvailable,
  }
}

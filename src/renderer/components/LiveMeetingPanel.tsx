import { useCallback, useEffect, useRef, useState } from 'react'
import { LiveMeetingControls } from './LiveMeetingControls'
import { LiveMeetingTranscript } from './LiveMeetingTranscript'
import { useAudioCapture, useDesktopCaptureAvailable } from '../hooks/useAudioCapture'
import { SpeakerRegistry } from '../meeting/live/speakers'
import { mergeLiveMessages, segmentsToMessages, transcribeBlob } from '../meeting/live/transcribe'
import type { LiveTranscriptMessage, ServerHealth } from '../meeting/live/types'

const CHUNK_MS = 8000

export function LiveMeetingPanel() {
  const [micEnabled, setMicEnabled] = useState(true)
  const [desktopEnabled, setDesktopEnabled] = useState(false)
  const [messages, setMessages] = useState<LiveTranscriptMessage[]>([])
  const [health, setHealth] = useState<ServerHealth | null>(null)
  const [statusLine, setStatusLine] = useState('Checking WhisperX…')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const desktopAvailable = useDesktopCaptureAvailable()
  const registryRef = useRef(new SpeakerRegistry())
  const chunkIndexRef = useRef(0)
  const queueRef = useRef(Promise.resolve())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void fetch('/api/health')
      .then((response) => response.json())
      .then((payload: ServerHealth) => {
        setHealth(payload)
        setStatusLine(
          payload.diarize_available
            ? `WhisperX ${payload.model ?? ''} · diarization on`
            : `WhisperX ${payload.model ?? ''} · diarization off (speech may show as Person 1)`
        )
      })
      .catch(() => setStatusLine('WhisperX unreachable — set WHISPERX_BASE_URL in .env'))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const enqueueTranscription = useCallback(
    (blob: Blob) => {
      const index = chunkIndexRef.current
      chunkIndexRef.current += 1
      const offsetSec = index * (CHUNK_MS / 1000)

      queueRef.current = queueRef.current
        .then(async () => {
          setBusy(true)
          setError(null)
          const result = await transcribeBlob(blob, {
            diarize: health?.diarize_available === true
          })
          const segments = result.segments ?? []
          if (segments.length === 0 && result.text?.trim()) {
            segments.push({
              start: 0,
              end: CHUNK_MS / 1000,
              text: result.text.trim()
            })
          }
          const incoming = segmentsToMessages(segments, registryRef.current, offsetSec)
          setMessages((prev) => mergeLiveMessages(prev, incoming))
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err)
          setError(message)
        })
        .finally(() => setBusy(false))
    },
    [health?.diarize_available]
  )

  const { status, start, stop } = useAudioCapture({
    micEnabled,
    desktopEnabled,
    chunkMs: CHUNK_MS,
    onChunk: enqueueTranscription,
    onError: setError
  })

  const listening = status === 'listening'

  const toggleListen = (): void => {
    if (listening) stop()
    else void start()
  }

  const clearChat = (): void => {
    registryRef.current.reset()
    chunkIndexRef.current = 0
    setMessages([])
    setError(null)
  }

  return (
    <div className="live-meeting-panel">
      <div className="live-meeting-header">
        <p className="live-meeting-status">{statusLine}</p>
        <span className={`status-pill ${listening ? 'live' : ''} ${busy ? 'busy' : ''}`}>
          {listening ? (busy ? 'Transcribing…' : 'Listening') : 'Idle'}
        </span>
      </div>

      {error ? <div className="callout danger">{error}</div> : null}

      <LiveMeetingTranscript messages={messages} bottomRef={bottomRef} />

      <LiveMeetingControls
        micEnabled={micEnabled}
        desktopEnabled={desktopEnabled}
        desktopAvailable={desktopAvailable}
        listening={listening}
        busy={busy}
        onMicChange={setMicEnabled}
        onDesktopChange={setDesktopEnabled}
        onToggleListen={toggleListen}
        onClear={clearChat}
      />
    </div>
  )
}

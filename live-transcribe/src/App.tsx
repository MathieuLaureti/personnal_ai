import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatTranscript } from './components/ChatTranscript'
import { Controls } from './components/Controls'
import { useAudioCapture, useDesktopCaptureAvailable } from './hooks/useAudioCapture'
import { SpeakerRegistry } from './lib/speakers'
import {
  mergeChatMessages,
  segmentsToMessages,
  transcribeBlob
} from './lib/transcribe'
import type { ChatMessage, ServerHealth } from './lib/types'
import './styles.css'

const CHUNK_MS = 8000

export default function App() {
  const [micEnabled, setMicEnabled] = useState(true)
  const [desktopEnabled, setDesktopEnabled] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
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
      .then((r) => r.json())
      .then((h: ServerHealth) => {
        setHealth(h)
        setStatusLine(
          h.diarize_available
            ? `WhisperX ${h.model ?? ''} · diarization on`
            : `WhisperX ${h.model ?? ''} · diarization off (all speech may show as Person 1)`
        )
      })
      .catch(() => setStatusLine('WhisperX unreachable — start dev server on LAN PC'))
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
          setMessages((prev) => mergeChatMessages(prev, incoming))
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

  const toggleListen = () => {
    if (listening) stop()
    else void start()
  }

  const clearChat = () => {
    registryRef.current.reset()
    chunkIndexRef.current = 0
    setMessages([])
    setError(null)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <strong>Live transcribe</strong>
          <span>{statusLine}</span>
        </div>
        <div className={`status-pill ${listening ? 'live' : ''} ${busy ? 'busy' : ''}`}>
          {listening ? (busy ? 'Transcribing…' : 'Listening') : 'Paused'}
        </div>
      </header>

      {error ? <div className="banner error">{error}</div> : null}

      <ChatTranscript messages={messages} bottomRef={bottomRef} />

      <Controls
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

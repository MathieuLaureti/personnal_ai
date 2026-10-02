import { useEffect, useRef, useState } from 'react'
import type { MeetingTranscribeResult } from '@shared/types'
import { LiveMeetingPanel } from './LiveMeetingPanel'

type Props = {
  disabled?: boolean
}

type MeetingMode = 'live' | 'batch'

export function MeetingPanel({ disabled }: Props) {
  const [mode, setMode] = useState<MeetingMode>('live')
  const [audioPath, setAudioPath] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [result, setResult] = useState<MeetingTranscribeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const httpMode = document.documentElement.dataset.bridge === 'http'

  useEffect(() => {
    return window.personnalAI.onMeetingProgress((event) => {
      if (event.type === 'log') {
        setLogs((prev) => [...prev.slice(-200), event.line])
      }
      if (event.type === 'error') {
        setError(event.message)
        setBusy(false)
      }
      if (event.type === 'done') {
        setResult(event.result)
        setBusy(false)
      }
    })
  }, [])

  async function pickFile(): Promise<void> {
    setError(null)
    if (httpMode) {
      fileRef.current?.click()
      return
    }
    const path = await window.personnalAI.pickMeetingAudio()
    if (path) {
      setAudioPath(path)
      setResult(null)
      setLogs([])
    }
  }

  async function onHttpFileChange(file: File | null): Promise<void> {
    if (!file) return
    setAudioPath(file.name)
    setResult(null)
    setLogs([])
    setError(null)
    setBusy(true)
    try {
      const body = new Uint8Array(await file.arrayBuffer())
      const response = await fetch('/api/meeting/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename': file.name
        },
        body
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const payload = (await response.json()) as MeetingTranscribeResult
      setResult(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function transcribe(): Promise<void> {
    if (!audioPath || httpMode) return
    setBusy(true)
    setError(null)
    setResult(null)
    setLogs([])
    try {
      const payload = await window.personnalAI.transcribeMeeting({ audioPath })
      setResult(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="meeting-panel">
      <div className="meeting-mode-tabs">
        <button
          type="button"
          className={`btn ghost ${mode === 'live' ? 'active' : ''}`}
          onClick={() => setMode('live')}
        >
          Live
        </button>
        <button
          type="button"
          className={`btn ghost ${mode === 'batch' ? 'active' : ''}`}
          onClick={() => setMode('batch')}
        >
          Batch file
        </button>
      </div>

      {mode === 'live' ? (
        <LiveMeetingPanel />
      ) : (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,video/mp4,video/webm"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              void onHttpFileChange(file)
              event.target.value = ''
            }}
          />

          <div className="meeting-intro">
            <h2>Batch transcription</h2>
            <p>
              Full WhisperX + diarization via <code>meeting-transcriber/</code> on this machine (Python, CUDA,{' '}
              <code>HF_TOKEN</code> in <code>meeting-transcriber/.env</code>).
            </p>
          </div>

          <div className="meeting-actions">
            <button className="btn" type="button" disabled={disabled || busy} onClick={() => void pickFile()}>
              {httpMode ? 'Upload audio' : 'Choose audio file'}
            </button>
            {!httpMode ? (
              <button
                className="btn primary"
                type="button"
                disabled={disabled || busy || !audioPath}
                onClick={() => void transcribe()}
              >
                {busy ? 'Transcribing…' : 'Transcribe'}
              </button>
            ) : null}
          </div>

          {audioPath ? (
            <p className="meeting-path">
              <span className="muted">File:</span> {audioPath}
            </p>
          ) : null}

          {error ? <div className="callout danger">{error}</div> : null}

          {logs.length > 0 ? (
            <pre className="meeting-log" aria-live="polite">
              {logs.join('\n')}
            </pre>
          ) : null}

          {result ? (
            <section className="meeting-result">
              <h3>Transcript</h3>
              <pre>{result.plaintext}</pre>
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}

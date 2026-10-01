import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'

export type CaptureStatus = 'idle' | 'listening' | 'error'

type Options = {
  micEnabled: boolean
  desktopEnabled: boolean
  chunkMs: number
  onChunk: (blob: Blob) => void
  onError: (message: string | null) => void
}

const DISPLAY_SINK_ID = 'live-transcribe-display-sink'

function isMobileUa(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

/** System audio capture needs Chromium desktop (not Firefox). */
export function useDesktopCaptureAvailable(): boolean {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    const ua = navigator.userAgent
    const chromiumDesktop =
      !isMobileUa() &&
      typeof navigator.mediaDevices?.getDisplayMedia === 'function' &&
      !/Firefox\//i.test(ua)
    setAvailable(chromiumDesktop)
  }, [])
  return available
}

function friendlyCaptureError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError') {
      return 'Permission denied. Allow screen/audio sharing in the browser prompt.'
    }
    if (err.name === 'NotSupportedError' || err.message.toLowerCase().includes('not supported')) {
      return (
        'Desktop audio is not supported here. On Windows use Chrome or Edge, choose ' +
        'Entire screen (or a tab with audio), and check “Share system audio”. ' +
        'Firefox cannot capture system audio.'
      )
    }
    if (err.name === 'AbortError') {
      return 'Screen share was cancelled.'
    }
    return err.message || err.name
  }
  if (err instanceof Error) return err.message
  return String(err)
}

function attachDisplayPreview(stream: MediaStream): void {
  let el = document.getElementById(DISPLAY_SINK_ID) as HTMLVideoElement | null
  if (!el) {
    el = document.createElement('video')
    el.id = DISPLAY_SINK_ID
    el.muted = true
    el.playsInline = true
    el.setAttribute('aria-hidden', 'true')
    el.style.cssText =
      'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px'
    document.body.appendChild(el)
  }
  el.srcObject = stream
  void el.play().catch(() => {})
}

function detachDisplayPreview(): void {
  const el = document.getElementById(DISPLAY_SINK_ID) as HTMLVideoElement | null
  if (!el) return
  el.srcObject = null
}

type ChromiumDisplayOptions = DisplayMediaStreamOptions & {
  systemAudio?: 'include' | 'exclude'
}

async function captureDesktopStream(): Promise<MediaStream> {
  const constraints: ChromiumDisplayOptions = {
    video: { displaySurface: 'monitor' },
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    },
    systemAudio: 'include'
  }
  return navigator.mediaDevices.getDisplayMedia(constraints)
}

function buildRecordStream(
  streams: MediaStream[],
  audioContextRef: MutableRefObject<AudioContext | null>
): MediaStream {
  if (streams.length === 1) {
    const only = streams[0]
    const audioTracks = only.getAudioTracks()
    if (audioTracks.length > 0) {
      return new MediaStream(audioTracks)
    }
    return only
  }

  const ctx = new AudioContext()
  audioContextRef.current = ctx
  const dest = ctx.createMediaStreamDestination()
  for (const stream of streams) {
    if (stream.getAudioTracks().length === 0) continue
    ctx.createMediaStreamSource(stream).connect(dest)
  }
  return dest.stream
}

function createMediaRecorder(stream: MediaStream): MediaRecorder {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'video/webm;codecs=vp8,opus', '']
  for (const mimeType of candidates) {
    if (mimeType && !MediaRecorder.isTypeSupported(mimeType)) continue
    try {
      return mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    } catch {
      continue
    }
  }
  throw new DOMException('Could not start recorder for this audio source.', 'NotSupportedError')
}

export function useAudioCapture(options: Options) {
  const { micEnabled, desktopEnabled, chunkMs, onChunk, onError } = options
  const [status, setStatus] = useState<CaptureStatus>('idle')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamsRef = useRef<MediaStream[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const onChunkRef = useRef(onChunk)
  onChunkRef.current = onChunk

  const cleanup = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    for (const s of streamsRef.current) {
      s.getTracks().forEach((t) => t.stop())
    }
    streamsRef.current = []
    detachDisplayPreview()
    void audioContextRef.current?.close()
    audioContextRef.current = null
  }, [])

  const stop = useCallback(() => {
    cleanup()
    setStatus('idle')
  }, [cleanup])

  const start = useCallback(async () => {
    cleanup()
    setStatus('idle')
    if (!micEnabled && !desktopEnabled) {
      onError('Enable microphone or desktop audio before listening.')
      setStatus('error')
      return
    }

    try {
      const streams: MediaStream[] = []

      if (micEnabled) {
        const mic = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          },
          video: false
        })
        streams.push(mic)
      }

      if (desktopEnabled) {
        const display = await captureDesktopStream()
        attachDisplayPreview(display)
        if (display.getAudioTracks().length === 0) {
          throw new Error(
            'No desktop audio in the share. Pick Entire screen or a tab and enable “Share system audio”, then try again.'
          )
        }
        streams.push(display)
      }

      streamsRef.current = streams

      const recordStream = buildRecordStream(streams, audioContextRef)
      if (recordStream.getAudioTracks().length === 0) {
        throw new Error('No audio tracks available to record.')
      }

      await audioContextRef.current?.resume()

      const recorder = createMediaRecorder(recordStream)
      recorderRef.current = recorder
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 800) onChunkRef.current(ev.data)
      }
      recorder.onerror = () => onError('MediaRecorder error while capturing audio.')
      recorder.start(chunkMs)
      setStatus('listening')
      onError(null)
    } catch (err) {
      cleanup()
      onError(friendlyCaptureError(err))
      setStatus('error')
    }
  }, [chunkMs, cleanup, desktopEnabled, micEnabled, onError])

  useEffect(() => () => cleanup(), [cleanup])

  return { status, start, stop }
}

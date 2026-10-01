import { SpeakerRegistry, formatClock } from './speakers'
import type { LiveTranscriptMessage, VerboseTranscription, WhisperSegment } from './types'

import type { TranscriptionLanguage } from './types'

function parseErrorMessage(raw: string, status: number): string {
  const trimmed = raw.trim()
  if (!trimmed) return `Transcribe failed (${status}).`
  try {
    const parsed = JSON.parse(trimmed) as { error?: string; message?: string; detail?: string }
    return parsed.error || parsed.message || parsed.detail || trimmed
  } catch {
    return trimmed
  }
}

export async function transcribeBlob(
  blob: Blob,
  options: { diarize: boolean; language: TranscriptionLanguage; model?: string }
): Promise<VerboseTranscription> {
  const model = options.model?.trim() || 'large-v3'
  const body = await blob.arrayBuffer()
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': blob.type || 'audio/webm',
      'X-Whisper-Model': model,
      'X-Whisper-Language': options.language,
      ...(options.diarize ? { 'X-Whisper-Diarize': 'true' } : {})
    },
    body
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(parseErrorMessage(err, res.status))
  }
  return (await res.json()) as VerboseTranscription
}

export function segmentsToMessages(
  segments: WhisperSegment[],
  registry: SpeakerRegistry,
  sessionOffsetSec: number
): LiveTranscriptMessage[] {
  const out: LiveTranscriptMessage[] = []
  for (const seg of segments) {
    const text = (seg.text ?? '').trim()
    if (!text) continue
    const person = registry.personFor(seg.speaker)
    out.push({
      id: `${sessionOffsetSec}-${seg.start}-${person}-${text.slice(0, 12)}`,
      person,
      text,
      timeLabel: formatClock(sessionOffsetSec + seg.start)
    })
  }
  return out
}

export function mergeLiveMessages(
  prev: LiveTranscriptMessage[],
  incoming: LiveTranscriptMessage[]
): LiveTranscriptMessage[] {
  if (incoming.length === 0) return prev
  const merged = [...prev]
  for (const msg of incoming) {
    const last = merged[merged.length - 1]
    if (last && last.person === msg.person) {
      last.text = `${last.text} ${msg.text}`.trim()
      last.timeLabel = msg.timeLabel
    } else {
      merged.push({ ...msg })
    }
  }
  return merged
}

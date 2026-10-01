import { SpeakerRegistry, formatClock } from './speakers'
import type { LiveTranscriptMessage, VerboseTranscription, WhisperSegment } from './types'

export async function transcribeBlob(
  blob: Blob,
  options: { diarize: boolean; language?: string }
): Promise<VerboseTranscription> {
  const form = new FormData()
  form.append('file', blob, `chunk-${Date.now()}.webm`)
  form.append('model', 'large-v3')
  form.append('response_format', 'verbose_json')
  if (options.language) form.append('language', options.language)
  if (options.diarize) form.append('diarize', 'true')

  const res = await fetch('/api/transcribe', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Transcribe failed (${res.status})`)
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

export interface WhisperSegment {
  start: number
  end: number
  text: string
  speaker?: string
}

export interface VerboseTranscription {
  segments?: WhisperSegment[]
  text?: string
  language?: string
}

export interface LiveTranscriptMessage {
  id: string
  person: number
  text: string
  timeLabel: string
}

export interface ServerHealth {
  status: string
  model?: string
  diarize_available?: boolean
}

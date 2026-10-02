export type ProviderKind = 'gemini' | 'openai-compatible'

export type AppSettings = {
  provider: ProviderKind
  apiKey: string
  envKey: string
  baseUrl: string
  model: string
  label: string
  thinkingEnabled: boolean
  docsFolder: string
}

export type ModelProfile = {
  label: string
  provider: ProviderKind
  id: string
  baseUrl?: string
  thinking?: boolean
  envKey?: string
}

export type ModelsFile = {
  active: string
  docsFolder?: string
  models: Record<string, ModelProfile>
}

export type ModelChoice = {
  id: string
  label: string
  model: string
  provider: ProviderKind
  hasApiKey: boolean
}

export type RuntimeInfo = {
  active: string
  label: string
  model: string
  provider: ProviderKind
  docsFolder: string
  hasApiKey: boolean
  models: ModelChoice[]
}

export type ChatRole = 'user' | 'assistant'

export type ToolTrace = {
  id: string
  name: string
  args: unknown
  result?: string
  status: 'running' | 'done' | 'error'
}

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  thinking?: string
  tools?: ToolTrace[]
  error?: string
}

export type ChatEvent =
  | { type: 'thinking_delta'; text: string }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_start'; id: string; name: string; args: unknown }
  | { type: 'tool_result'; id: string; name: string; result: string }
  | { type: 'error'; message: string }
  | { type: 'done' }

export type MeetingTurn = {
  speaker: string
  start: number
  end: number
  text: string
}

export type MeetingTranscribeRequest = {
  audioPath: string
  minSpeakers?: number
  maxSpeakers?: number
}

export type MeetingTranscribeResult = {
  audioPath: string
  turns: MeetingTurn[]
  plaintext: string
}

export type MeetingProgressEvent =
  | { type: 'log'; line: string }
  | { type: 'done'; result: MeetingTranscribeResult }
  | { type: 'error'; message: string }

export const DEFAULT_BASE_URLS: Record<ProviderKind, string> = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  'openai-compatible': 'https://openrouter.ai/api/v1'
}

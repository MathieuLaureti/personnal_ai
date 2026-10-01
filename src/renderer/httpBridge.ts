import type {
  ChatEvent,
  ChatMessage,
  MeetingProgressEvent,
  MeetingTranscribeRequest,
  MeetingTranscribeResult,
  RuntimeInfo
} from '@shared/types'

export function installHttpBridge(): void {
  if (window.personnalAI) return

  const listeners = new Set<(event: ChatEvent) => void>()
  let abort: AbortController | null = null

  window.personnalAI = {
    getRuntime: async () => {
      const response = await fetch('/api/runtime')
      if (!response.ok) throw new Error(await readError(response))
      return (await response.json()) as RuntimeInfo
    },
    setActiveModel: async (id: string) => {
      const response = await fetch('/api/runtime/active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!response.ok) throw new Error(await readError(response))
      return (await response.json()) as RuntimeInfo
    },
    sendChat: async (history: ChatMessage[]) => {
      abort?.abort()
      abort = new AbortController()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history }),
        signal: abort.signal
      })
      if (!response.ok) throw new Error(await readError(response))
      for await (const event of readEvents(response, abort.signal)) {
        for (const listener of listeners) listener(event)
      }
    },
    abortChat: async () => {
      abort?.abort()
      await fetch('/api/chat/abort', { method: 'POST' }).catch(() => undefined)
    },
    onChatEvent: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    pickMeetingAudio: async () => null,
    transcribeMeeting: async (_request: MeetingTranscribeRequest) => {
      throw new Error('Meeting file pick is only available in the Electron app.')
    },
    onMeetingProgress: (_listener: (event: MeetingProgressEvent) => void) => () => undefined
  }

  document.documentElement.dataset.bridge = 'http'
}

async function readError(response: Response): Promise<string> {
  const text = await response.text()
  try {
    const parsed = JSON.parse(text) as { error?: string; message?: string }
    return parsed.error || parsed.message || `Request failed (${response.status}).`
  } catch {
    return `Request failed (${response.status}).`
  }
}

async function* readEvents(response: Response, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  if (!response.body) throw new Error('Chat API returned an empty body.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      if (signal.aborted) return
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() ?? ''
      for (const block of blocks) {
        const line = block.split(/\r?\n/).find((entry) => entry.startsWith('data:'))
        if (!line) continue
        const payload = line.slice(5).trim()
        if (!payload) continue
        yield JSON.parse(payload) as ChatEvent
      }
    }
  } finally {
    reader.releaseLock()
  }
}

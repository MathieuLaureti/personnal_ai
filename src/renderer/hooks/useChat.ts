import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { ChatEvent, ChatMessage, ToolTrace } from '@shared/types'

function id(): string {
  return crypto.randomUUID()
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const assistantId = useRef<string | null>(null)

  useEffect(() => {
    return window.personnalAI.onChatEvent((event) => applyEvent(event, assistantId, setMessages, setStreaming))
  }, [])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const user: ChatMessage = { id: id(), role: 'user', content: trimmed }
    const assistant: ChatMessage = { id: id(), role: 'assistant', content: '', thinking: '', tools: [] }
    assistantId.current = assistant.id
    setStreaming(true)
    setMessages((current) => [...current, user, assistant])
    try {
      await window.personnalAI.sendChat([...messages, user])
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught)
      markError(assistant.id, message, setMessages)
      setStreaming(false)
    }
  }, [messages])

  const stop = useCallback(async () => {
    await window.personnalAI.abortChat()
    setStreaming(false)
  }, [])

  const reset = useCallback(() => {
    assistantId.current = null
    setMessages([])
    setStreaming(false)
  }, [])

  return { messages, streaming, send, stop, reset }
}

function applyEvent(
  event: ChatEvent,
  assistantId: { current: string | null },
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  setStreaming: (value: boolean) => void
): void {
  const target = assistantId.current
  if (!target) return

  if (event.type === 'error') {
    markError(target, event.message, setMessages)
    setStreaming(false)
    return
  }
  if (event.type === 'done') {
    setStreaming(false)
    return
  }

  setMessages((current) =>
    current.map((message) => {
      if (message.id !== target) return message
      if (event.type === 'thinking_delta') {
        return { ...message, thinking: `${message.thinking ?? ''}${event.text}` }
      }
      if (event.type === 'text_delta') {
        return { ...message, content: `${message.content}${event.text}` }
      }
      if (event.type === 'tool_start') {
        const tools = [...(message.tools ?? [])]
        tools.push({ id: event.id, name: event.name, args: event.args, status: 'running' })
        return { ...message, tools }
      }
      if (event.type === 'tool_result') {
        const tools = (message.tools ?? []).map((tool) =>
          tool.id === event.id ? withResult(tool, event.result) : tool
        )
        return { ...message, tools }
      }
      return message
    })
  )
}

function markError(
  target: string,
  text: string,
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
): void {
  setMessages((current) =>
    current.map((message) => (message.id === target ? { ...message, error: text } : message))
  )
}

function withResult(tool: ToolTrace, result: string): ToolTrace {
  return {
    ...tool,
    result: result.length > 1200 ? `${result.slice(0, 1200)}\n…` : result,
    status: result.startsWith('ERROR:') ? 'error' : 'done'
  }
}

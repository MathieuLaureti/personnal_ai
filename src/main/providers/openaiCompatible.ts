import type { ChatMessage } from '../../shared/types'
import type { ToolCall, ToolDefinition } from '../notes/tools'
import { errorFromPayload, formatProviderError } from './errors'
import { readSseJson } from './sse'
import { asArgs, asRecord, type ModelProvider, type ProviderExtraTurn, type ProviderHandlers, type ProviderRequest, type ProviderTurn } from './types'

type OpenAiMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | null
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>
  tool_call_id?: string
  name?: string
}

export const openaiCompatibleProvider: ModelProvider = {
  async streamTurn(request, handlers) {
    const url = `${request.settings.baseUrl.replace(/\/+$/, '')}/chat/completions`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.settings.apiKey}`
      },
      body: JSON.stringify({
        model: request.settings.model,
        stream: true,
        messages: toMessages(request.system, request.history, request.extraTurns ?? []),
        tools: request.tools.map(toOpenAiTool)
      }),
      signal: handlers.signal
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(formatProviderError('Provider', response.status, detail))
    }

    return consumeStream(response, handlers)
  }
}

function toOpenAiTool(tool: ToolDefinition): unknown {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }
}

function toMessages(system: string, history: ChatMessage[], extra: ProviderExtraTurn[]): OpenAiMessage[] {
  const messages: OpenAiMessage[] = [{ role: 'system', content: system }]

  for (const message of history) {
    if (message.role === 'user') {
      messages.push({ role: 'user', content: message.content })
    } else {
      const content = [message.thinking ? `<think>${message.thinking}</think>` : '', message.content]
        .filter(Boolean)
        .join('\n\n')
      messages.push({ role: 'assistant', content })
    }
  }

  for (const turn of extra) {
    if (turn.kind === 'model') {
      messages.push({
        role: 'assistant',
        content: turn.text || null,
        tool_calls: turn.functionCalls.map((call, index) => ({
          id: call.id || `call_${index}`,
          type: 'function',
          function: { name: call.name, arguments: JSON.stringify(call.args ?? {}) }
        }))
      })
    } else {
      for (const result of turn.results) {
        messages.push({
          role: 'tool',
          tool_call_id: result.id || result.name,
          name: result.name,
          content: result.result
        })
      }
    }
  }

  return messages
}

async function consumeStream(response: Response, handlers: ProviderHandlers): Promise<ProviderTurn> {
  let text = ''
  let thinking = ''
  let pendingThink = ''
  const calls = new Map<number, { id?: string; name: string; args: string }>()

  for await (const event of readSseJson(response, handlers.signal)) {
    const streamError = errorFromPayload(event)
    if (streamError) throw new Error(streamError)

    const choice = (asRecord(event).choices as unknown[] | undefined)?.[0]
    const delta = asRecord(asRecord(choice).delta)
    const finish = asRecord(choice).finish_reason

    thinking += emitReasoning(delta, handlers)

    const content = typeof delta.content === 'string' ? delta.content : ''
    if (content) {
      const split = splitThink(pendingThink + content)
      pendingThink = split.pending
      if (split.thinking) {
        thinking += split.thinking
        handlers.emit({ type: 'thinking_delta', text: split.thinking })
      }
      if (split.text) {
        text += split.text
        handlers.emit({ type: 'text_delta', text: split.text })
      }
    }

    const toolDeltas = (delta.tool_calls as Array<Record<string, unknown>> | undefined) ?? []
    for (const toolDelta of toolDeltas) {
      const index = typeof toolDelta.index === 'number' ? toolDelta.index : 0
      const current = calls.get(index) ?? { name: '', args: '' }
      const fn = asRecord(toolDelta.function)
      if (typeof toolDelta.id === 'string') current.id = toolDelta.id
      if (typeof fn.name === 'string') current.name += fn.name
      if (typeof fn.arguments === 'string') current.args += fn.arguments
      calls.set(index, current)
    }

    if (finish === 'stop' || finish === 'tool_calls') break
  }

  if (pendingThink) {
    text += pendingThink
    handlers.emit({ type: 'text_delta', text: pendingThink })
  }

  const functionCalls: ToolCall[] = [...calls.values()]
    .filter((call) => call.name)
    .map((call) => ({ id: call.id, name: call.name, args: asArgs(call.args) }))

  return { text, thinking, functionCalls, rawModelParts: [] }
}

function emitReasoning(delta: Record<string, unknown>, handlers: ProviderHandlers): string {
  const pieces = [delta.reasoning_content, delta.reasoning].filter((value): value is string => typeof value === 'string')
  let added = ''
  for (const piece of pieces) {
    added += piece
    handlers.emit({ type: 'thinking_delta', text: piece })
  }
  return added
}

function splitThink(input: string): { thinking: string; text: string; pending: string } {
  let thinking = ''
  let text = ''
  let rest = input

  while (rest.length) {
    const open = rest.indexOf('<think>')
    const close = rest.indexOf('</think>')

    if (open === -1 && close === -1) {
      text += rest
      rest = ''
      break
    }

    if (open !== -1 && (close === -1 || open < close)) {
      text += rest.slice(0, open)
      rest = rest.slice(open + '<think>'.length)
      const end = rest.indexOf('</think>')
      if (end === -1) return { thinking, text, pending: `<think>${rest}` }
      thinking += rest.slice(0, end)
      rest = rest.slice(end + '</think>'.length)
      continue
    }

    if (close !== -1) {
      thinking += rest.slice(0, close)
      rest = rest.slice(close + '</think>'.length)
    }
  }

  return { thinking, text, pending: '' }
}

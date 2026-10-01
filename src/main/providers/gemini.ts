import type { ChatMessage } from '../../shared/types'
import type { ToolCall, ToolDefinition } from '../notes/tools'
import { errorFromPayload, formatProviderError } from './errors'
import { readSseJson } from './sse'
import { asArgs, asRecord, type ModelProvider, type ProviderExtraTurn, type ProviderHandlers, type ProviderRequest, type ProviderTurn } from './types'

type GeminiPart = {
  text?: string
  thought?: boolean
  thoughtSignature?: string
  functionCall?: { name?: string; args?: unknown; id?: string }
  functionResponse?: { name: string; id?: string; response: { result: string } }
}

export const geminiProvider: ModelProvider = {
  async streamTurn(request, handlers) {
    const url = buildUrl(request.settings.baseUrl, request.settings.model, request.settings.apiKey)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': request.settings.apiKey
      },
      body: JSON.stringify(buildBody(request)),
      signal: handlers.signal
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(formatProviderError('Gemini', response.status, detail))
    }

    return consumeStream(response, handlers)
  }
}

function buildUrl(baseUrl: string, model: string, apiKey: string): string {
  const root = baseUrl.replace(/\/+$/, '')
  const query = new URLSearchParams({ alt: 'sse', key: apiKey })
  return `${root}/models/${encodeURIComponent(model)}:streamGenerateContent?${query}`
}

function buildBody(request: ProviderRequest): unknown {
  return {
    systemInstruction: { parts: [{ text: request.system }] },
    contents: toContents(request.history, request.extraTurns ?? []),
    tools: [{ functionDeclarations: request.tools.map(toGeminiTool) }],
    generationConfig: {
      thinkingConfig: thinkingConfig(request.settings.model, request.settings.thinkingEnabled)
    }
  }
}

function toGeminiTool(tool: ToolDefinition): unknown {
  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'OBJECT',
      properties: Object.fromEntries(
        Object.entries(tool.parameters.properties).map(([key, value]) => [
          key,
          { type: 'STRING', description: value.description }
        ])
      ),
      required: tool.parameters.required
    }
  }
}

function toContents(history: ChatMessage[], extra: ProviderExtraTurn[]): Array<{ role: string; parts: GeminiPart[] }> {
  const contents: Array<{ role: string; parts: GeminiPart[] }> = []

  for (const message of history) {
    if (message.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: message.content }] })
      continue
    }
    const parts: GeminiPart[] = []
    if (message.thinking) parts.push({ text: message.thinking, thought: true })
    if (message.content) parts.push({ text: message.content })
    if (parts.length) contents.push({ role: 'model', parts })
  }

  for (const turn of extra) {
    if (turn.kind === 'model') {
      const parts: GeminiPart[] = []
      if (turn.thinking) parts.push({ text: turn.thinking, thought: true })
      for (const call of turn.functionCalls) {
        parts.push({
          functionCall: {
            name: call.name,
            args: call.args,
            id: call.id
          }
        })
      }
      if (turn.text) parts.push({ text: turn.text })
      contents.push({ role: 'model', parts: parts.length ? parts : [{ text: '' }] })
    } else {
      contents.push({
        role: 'user',
        parts: turn.results.map((result) => ({
          functionResponse: {
            name: result.name,
            id: result.id,
            response: { result: result.result }
          }
        }))
      })
    }
  }

  return contents
}

async function consumeStream(response: Response, handlers: ProviderHandlers): Promise<ProviderTurn> {
  let text = ''
  let thinking = ''
  const functionCalls: ToolCall[] = []
  const rawModelParts: unknown[] = []

  for await (const event of readSseJson(response, handlers.signal)) {
    const streamError = errorFromPayload(event)
    if (streamError) throw new Error(streamError)

    const candidate = (asRecord(event).candidates as unknown[] | undefined)?.[0]
    const content = asRecord(candidate).content
    const parts = (asRecord(content).parts as GeminiPart[] | undefined) ?? []
    for (const part of parts) {
      rawModelParts.push(part)
      if (part.functionCall?.name) {
        const call: ToolCall = {
          id: part.functionCall.id,
          name: part.functionCall.name,
          args: asArgs(part.functionCall.args)
        }
        const existing = functionCalls.find((item) => item.name === call.name && item.id === call.id)
        if (existing) existing.args = { ...existing.args, ...call.args }
        else functionCalls.push(call)
        continue
      }
      if (!part.text) continue
      if (part.thought) {
        thinking += part.text
        handlers.emit({ type: 'thinking_delta', text: part.text })
      } else {
        text += part.text
        handlers.emit({ type: 'text_delta', text: part.text })
      }
    }
  }

  return { text, thinking, functionCalls, rawModelParts }
}

function thinkingConfig(model: string, enabled: boolean): Record<string, unknown> {
  if (model.startsWith('gemma-')) {
    return {
      thinkingLevel: enabled ? 'high' : 'minimal',
      includeThoughts: enabled
    }
  }
  return { includeThoughts: enabled }
}

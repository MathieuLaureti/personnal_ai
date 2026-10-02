import type { AppSettings, ChatEvent, ChatMessage } from '../../shared/types'
import type { ToolCall, ToolDefinition } from '../notes/tools'

export type ProviderHandlers = {
  emit: (event: ChatEvent) => void
  signal?: AbortSignal
}

export type ProviderTurn = {
  text: string
  thinking: string
  functionCalls: ToolCall[]
  rawModelParts: unknown[]
}

export type ProviderRequest = {
  settings: AppSettings
  history: ChatMessage[]
  extraTurns?: ProviderExtraTurn[]
  tools: ToolDefinition[]
  system: string
}

export type ProviderExtraTurn =
  | { kind: 'model'; text: string; thinking?: string; functionCalls: ToolCall[] }
  | { kind: 'tool'; results: Array<{ id?: string; name: string; result: string }> }

export interface ModelProvider {
  streamTurn(request: ProviderRequest, handlers: ProviderHandlers): Promise<ProviderTurn>
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export function asArgs(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value))
    } catch {
      return { value }
    }
  }
  return asRecord(value)
}

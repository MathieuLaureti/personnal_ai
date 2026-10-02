import type { AppSettings } from '../../shared/types'
import { geminiProvider } from './gemini'
import { openaiCompatibleProvider } from './openaiCompatible'
import type { ModelProvider } from './types'

export function getProvider(settings: AppSettings): ModelProvider {
  return settings.provider === 'openai-compatible' ? openaiCompatibleProvider : geminiProvider
}

export type { ProviderExtraTurn, ProviderTurn } from './types'

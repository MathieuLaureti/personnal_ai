import { mkdir } from 'node:fs/promises'
import type { AppSettings, ChatEvent, ChatMessage } from '../../shared/types'
import { executeNoteTool, noteToolDefinitions } from '../notes/tools'
import { getProvider, type ProviderExtraTurn } from '../providers'
import { buildSystemPrompt } from './systemPrompt'

const MAX_TOOL_ROUNDS = 8

export async function runChat(options: {
  settings: AppSettings
  history: ChatMessage[]
  emit: (event: ChatEvent) => void
  signal?: AbortSignal
}): Promise<void> {
  const { settings, history, emit, signal } = options

  if (!settings.apiKey.trim()) {
    emit({ type: 'error', message: `Missing ${settings.envKey} in .env.` })
    return
  }
  if (!settings.docsFolder.trim()) {
    emit({ type: 'error', message: 'docsFolder is empty. Set it in config/models.json or PERSONNAL_AI_DOCS_FOLDER.' })
    return
  }

  const provider = getProvider(settings)
  const extraTurns: ProviderExtraTurn[] = []

  try {
    await mkdir(settings.docsFolder, { recursive: true })
    const system = await buildSystemPrompt(settings.docsFolder)
    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

      const turn = await provider.streamTurn(
        {
          settings,
          history,
          extraTurns,
          tools: noteToolDefinitions,
          system
        },
        { emit, signal }
      )

      if (turn.functionCalls.length === 0) {
        if (!turn.text && !turn.thinking) {
          emit({ type: 'text_delta', text: 'The model returned an empty reply.' })
        }
        emit({ type: 'done' })
        return
      }

      extraTurns.push({
        kind: 'model',
        text: turn.text,
        thinking: turn.thinking,
        functionCalls: turn.functionCalls
      })

      const results: Array<{ id?: string; name: string; result: string }> = []
      for (const call of turn.functionCalls) {
        const id = call.id || `${call.name}-${results.length}`
        emit({ type: 'tool_start', id, name: call.name, args: call.args })
        const result = await executeNoteTool(settings.docsFolder, call)
        emit({ type: 'tool_result', id, name: call.name, result })
        results.push({ id: call.id || id, name: call.name, result })
      }
      extraTurns.push({ kind: 'tool', results })
    }

    emit({ type: 'error', message: 'Stopped after too many tool rounds. Ask again with a narrower request.' })
  } catch (error) {
    if (isAbort(error)) {
      emit({ type: 'done' })
      return
    }
    const message = error instanceof Error ? error.message : String(error)
    emit({ type: 'error', message })
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError'
}

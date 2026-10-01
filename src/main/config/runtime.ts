import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import {
  DEFAULT_BASE_URLS,
  type AppSettings,
  type ModelChoice,
  type ModelsFile,
  type ProviderKind,
  type RuntimeInfo
} from '../../shared/types'
import { loadDotenv } from './env'

const GEMINI_URL = DEFAULT_BASE_URLS.gemini

export function configFilePath(cwd = process.cwd()): string {
  return join(cwd, 'config/models.json')
}

export function loadModelsFile(cwd = process.cwd()): ModelsFile {
  const file = configFilePath(cwd)
  if (!existsSync(file)) {
    throw new Error('Missing config/models.json. Create it next to the project config folder.')
  }
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as ModelsFile
  } catch {
    throw new Error('config/models.json is not valid JSON.')
  }
}

export function resolveRuntime(cwd = process.cwd()): { settings: AppSettings; info: RuntimeInfo } {
  loadDotenv(cwd)
  const file = loadModelsFile(cwd)
  const active = file.active?.trim()
  if (!active) throw new Error('config/models.json is missing an "active" model id.')

  const profile = file.models?.[active]
  if (!profile) {
    const known = Object.keys(file.models ?? {}).join(', ') || '(none)'
    throw new Error(`Unknown active model "${active}". Valid ids: ${known}.`)
  }

  const settings = toSettings(cwd, active, file)
  return { settings, info: toInfo(active, file, settings) }
}

export function setActiveModel(id: string, cwd = process.cwd()): { settings: AppSettings; info: RuntimeInfo } {
  loadDotenv(cwd)
  const file = loadModelsFile(cwd)
  const active = id.trim()
  if (!file.models?.[active]) {
    const known = Object.keys(file.models ?? {}).join(', ') || '(none)'
    throw new Error(`Unknown model "${active}". Valid ids: ${known}.`)
  }
  file.active = active
  writeFileSync(configFilePath(cwd), `${JSON.stringify(file, null, 2)}\n`, 'utf8')
  const settings = toSettings(cwd, active, file)
  return { settings, info: toInfo(active, file, settings) }
}

function toSettings(cwd: string, active: string, file: ModelsFile): AppSettings {
  const profile = file.models[active]
  const provider: ProviderKind = profile.provider === 'openai-compatible' ? 'openai-compatible' : 'gemini'
  const envKey = profile.envKey || (provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_COMPATIBLE_API_KEY')
  const model = profile.id?.trim()
  if (!model) throw new Error(`Model "${active}" is missing an "id".`)

  return {
    provider,
    apiKey: (process.env[envKey] ?? '').trim(),
    envKey,
    baseUrl: (profile.baseUrl || DEFAULT_BASE_URLS[provider] || GEMINI_URL).replace(/\/+$/, ''),
    model,
    label: profile.label || active,
    thinkingEnabled: profile.thinking !== false,
    docsFolder: resolveDocsFolder(cwd, file.docsFolder)
  }
}

function toInfo(active: string, file: ModelsFile, settings: AppSettings): RuntimeInfo {
  return {
    active,
    label: settings.label,
    model: settings.model,
    provider: settings.provider,
    docsFolder: settings.docsFolder,
    hasApiKey: Boolean(settings.apiKey),
    models: Object.entries(file.models ?? {}).map(([id, profile]) => toChoice(id, profile))
  }
}

function toChoice(id: string, profile: ModelsFile['models'][string]): ModelChoice {
  const provider: ProviderKind = profile.provider === 'openai-compatible' ? 'openai-compatible' : 'gemini'
  const envKey = profile.envKey || (provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_COMPATIBLE_API_KEY')
  return {
    id,
    label: profile.label || id,
    model: profile.id,
    provider,
    hasApiKey: Boolean((process.env[envKey] ?? '').trim())
  }
}

function resolveDocsFolder(cwd: string, fromConfig?: string): string {
  const override = process.env.PERSONNAL_AI_DOCS_FOLDER?.trim()
  const chosen = override || fromConfig || '.local/docs'
  return isAbsolute(chosen) ? chosen : resolve(cwd, chosen)
}

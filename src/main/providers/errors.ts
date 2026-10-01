const GENERIC = /^(provider returned error|internal server error|bad gateway|service unavailable|unknown error|error)$/i

export function extractProviderMessage(detail: string): string {
  const trimmed = detail.trim()
  if (!trimmed) return ''

  try {
    return pickMessage(JSON.parse(trimmed))
  } catch {
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return ''
    return collapse(trimmed)
  }
}

export function formatProviderError(provider: string, status: number, detail: string): string {
  const message = extractProviderMessage(detail)
  if (message && !GENERIC.test(message)) return message
  if (status === 429) return message || `${provider} rate limit reached. Try again in a minute.`
  if (status === 404) return message || 'Unknown model. Check the active id in config/models.json.'
  if (status === 401 || status === 403) return message || `${provider} refused the API key.`
  if (message) return message
  return `${provider} request failed (${status}).`
}

export function errorFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (record.error == null) return null
  const message = pickMessage(payload)
  return message || 'Request failed.'
}

function pickMessage(value: unknown, depth = 0): string {
  const candidates = collectMessages(value, depth)
  const specific = candidates.find((text) => text && !GENERIC.test(text))
  return specific || candidates[0] || ''
}

function collectMessages(value: unknown, depth: number): string[] {
  if (depth > 8) return []
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return collectMessages(JSON.parse(trimmed), depth + 1)
      } catch {
        return [collapse(trimmed)]
      }
    }
    return [collapse(trimmed)]
  }
  if (!value || typeof value !== 'object') return []

  const record = value as Record<string, unknown>
  const found: string[] = []

  if (typeof record.message === 'string') found.push(...collectMessages(record.message, depth + 1))
  if (typeof record.msg === 'string') found.push(...collectMessages(record.msg, depth + 1))
  if (typeof record.status === 'string') found.push(...collectMessages(record.status, depth + 1))
  if (record.error !== undefined) found.push(...collectMessages(record.error, depth + 1))
  if (record.metadata !== undefined) found.push(...collectMessages(record.metadata, depth + 1))
  if (record.raw !== undefined) found.push(...collectMessages(record.raw, depth + 1))
  if (record.details !== undefined) found.push(...collectMessages(record.details, depth + 1))

  return found.map(collapse).filter(Boolean)
}

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

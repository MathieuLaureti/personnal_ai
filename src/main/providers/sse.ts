export async function* readSseJson(response: Response, signal?: AbortSignal): AsyncGenerator<unknown> {
  if (!response.body) throw new Error('Provider returned an empty body.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() ?? ''
      for (const block of blocks) {
        const payload = sseData(block)
        if (payload === null) continue
        if (payload === '[DONE]') return
        yield JSON.parse(payload)
      }
    }

    const tail = sseData(buffer)
    if (tail && tail !== '[DONE]') yield JSON.parse(tail)
  } finally {
    reader.releaseLock()
  }
}

function sseData(block: string): string | null {
  const lines = block.split(/\r?\n/).filter((line) => line.startsWith('data:'))
  if (lines.length === 0) return null
  return lines.map((line) => line.slice(5).trimStart()).join('\n').trim()
}

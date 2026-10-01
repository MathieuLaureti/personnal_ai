import type { IncomingMessage, ServerResponse } from 'node:http'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import type { ChatEvent, ChatMessage } from './src/shared/types'
import { runChat } from './src/main/chat/runChat'
import { resolveRuntime, setActiveModel } from './src/main/config/runtime'
import { runMeetingTranscription } from './src/main/meeting/runTranscription'

export function chatApiPlugin(): Plugin {
  let chatAbort: AbortController | null = null

  return {
    name: 'personnal-ai-chat-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/api/')) {
          next()
          return
        }

        try {
          if (req.method === 'GET' && url === '/api/runtime') {
            json(res, 200, resolveRuntime().info)
            return
          }

          if (req.method === 'PUT' && url === '/api/runtime/active') {
            const payload = (await readJson(req)) as { id?: string }
            json(res, 200, setActiveModel(payload.id ?? '').info)
            return
          }

          if (req.method === 'POST' && url === '/api/chat/abort') {
            chatAbort?.abort()
            chatAbort = null
            json(res, 200, { ok: true })
            return
          }

          if (req.method === 'POST' && url === '/api/chat') {
            const payload = (await readJson(req)) as { history?: ChatMessage[] }
            const { settings } = resolveRuntime()
            chatAbort?.abort()
            chatAbort = new AbortController()
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive'
            })
            req.on('close', () => chatAbort?.abort())
            await runChat({
              settings,
              history: payload.history ?? [],
              emit: (event: ChatEvent) => {
                res.write(`data: ${JSON.stringify(event)}\n\n`)
              },
              signal: chatAbort.signal
            })
            res.end()
            return
          }

          if (req.method === 'POST' && url === '/api/meeting/transcribe') {
            const filenameHeader = req.headers['x-filename']
            const filename =
              typeof filenameHeader === 'string' && filenameHeader.trim()
                ? filenameHeader.trim().replace(/[/\\]/g, '_')
                : 'upload.wav'
            const body = await readBody(req)
            const tempDir = await mkdtemp(join(tmpdir(), 'personnal-ai-upload-'))
            const audioPath = join(tempDir, filename)
            try {
              await writeFile(audioPath, body)
              const result = await runMeetingTranscription({ audioPath })
              json(res, 200, result)
            } finally {
              await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
            }
            return
          }

          json(res, 404, { error: 'Not found' })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          if (!res.headersSent) {
            json(res, 500, { error: message })
            return
          }
          res.write(`data: ${JSON.stringify({ type: 'error', message } satisfies ChatEvent)}\n\n`)
          res.end()
        }
      })
    }
  }
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

type Options = { whisperBase: string }

export function transcribeApiPlugin({ whisperBase }: Options): Plugin {
  const base = whisperBase.replace(/\/$/, '')

  return {
    name: 'live-transcribe-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/api/')) {
          next()
          return
        }

        try {
          if (req.method === 'GET' && url === '/api/health') {
            const upstream = await fetch(`${base}/health`)
            const body = await upstream.text()
            res.writeHead(upstream.status, {
              'Content-Type': upstream.headers.get('content-type') ?? 'application/json'
            })
            res.end(body)
            return
          }

          if (req.method === 'POST' && url === '/api/transcribe') {
            const contentType = req.headers['content-type']
            if (!contentType?.includes('multipart/form-data')) {
              json(res, 400, { error: 'Expected multipart/form-data' })
              return
            }
            const body = await readBody(req)
            const started = Date.now()
            const upstream = await fetch(`${base}/v1/audio/transcriptions`, {
              method: 'POST',
              headers: { 'Content-Type': contentType },
              body: new Uint8Array(body)
            })
            const text = await upstream.text()
            const ms = Date.now() - started
            if (!upstream.ok) {
              console.error(`[live-transcribe] WhisperX ${upstream.status} in ${ms}ms: ${text.slice(0, 400)}`)
            } else {
              console.log(`[live-transcribe] WhisperX ok in ${ms}ms (${body.length} bytes)`)
            }
            res.writeHead(upstream.status, {
              'Content-Type': upstream.headers.get('content-type') ?? 'application/json'
            })
            res.end(text)
            return
          }

          json(res, 404, { error: 'Not found' })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          json(res, 502, { error: message })
        }
      })
    }
  }
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

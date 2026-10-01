import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}

export function whisperxApiPlugin(mode = 'development'): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const whisperBase = (env.WHISPERX_BASE_URL || 'http://192.168.2.99:11436').replace(/\/$/, '')

  return {
    name: 'personnal-ai-whisperx-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (url !== '/api/health' && url !== '/api/transcribe') {
          next()
          return
        }

        try {
          if (req.method === 'GET' && url === '/api/health') {
            const upstream = await fetch(`${whisperBase}/health`)
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
            const upstream = await fetch(`${whisperBase}/v1/audio/transcriptions`, {
              method: 'POST',
              headers: { 'Content-Type': contentType },
              body: new Uint8Array(body)
            })
            const text = await upstream.text()
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

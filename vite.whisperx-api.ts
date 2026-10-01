import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { loadDotenv } from './src/main/config/env'

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}

async function ffmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('ffmpeg', ['-version'], { stdio: 'ignore' })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
  })
}

async function webmBufferToWav(input: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'personnal-ai-ffmpeg-'))
  const inPath = join(dir, 'in.webm')
  const outPath = join(dir, 'out.wav')
  try {
    await writeFile(inPath, input)
    const code = await new Promise<number>((resolve, reject) => {
      const child = spawn(
        'ffmpeg',
        ['-y', '-hide_banner', '-loglevel', 'error', '-i', inPath, '-ar', '16000', '-ac', '1', outPath],
        { stdio: 'ignore' }
      )
      child.on('error', reject)
      child.on('close', (status) => resolve(status ?? 1))
    })
    if (code !== 0) {
      throw new Error(`ffmpeg exited with code ${code}`)
    }
    return await readFile(outPath)
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined)
  }
}

async function forwardToWhisper(
  whisperBase: string,
  audio: Buffer,
  filename: string,
  mime: string,
  fields: Record<string, string>
): Promise<{ status: number; body: string; contentType: string | null }> {
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(audio)], { type: mime }), filename)
  for (const [key, value] of Object.entries(fields)) {
    if (value) form.append(key, value)
  }
  const upstream = await fetch(`${whisperBase}/v1/audio/transcriptions`, {
    method: 'POST',
    body: form
  })
  const body = await upstream.text()
  return {
    status: upstream.status,
    body,
    contentType: upstream.headers.get('content-type')
  }
}

export function whisperxApiPlugin(mode = 'development'): Plugin {
  loadDotenv()
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
            const contentType = req.headers['content-type'] ?? ''
            const modelHeader = req.headers['x-whisper-model']
            const model =
              typeof modelHeader === 'string' && modelHeader.trim() ? modelHeader.trim() : 'large-v3'
            const diarize = req.headers['x-whisper-diarize'] === 'true'
            const langHeader = req.headers['x-whisper-language']
            const rawLang = typeof langHeader === 'string' ? langHeader.trim().toLowerCase() : ''
            const language = rawLang === 'fr' ? 'fr' : 'en'
            const fields: Record<string, string> = {
              model,
              response_format: 'verbose_json',
              language
            }
            if (diarize) fields.diarize = 'true'

            let audio: Buffer
            let filename = 'chunk.webm'
            let mime = 'audio/webm'

            if (contentType.includes('multipart/form-data')) {
              const body = await readBody(req)
              const upstream = await fetch(`${whisperBase}/v1/audio/transcriptions`, {
                method: 'POST',
                headers: { 'Content-Type': contentType },
                body: new Uint8Array(body)
              })
              const text = await upstream.text()
              if (!upstream.ok) {
                console.error(
                  `[whisperx-proxy] upstream ${upstream.status} (multipart): ${text.slice(0, 500)}`
                )
                json(res, upstream.status, {
                  error: text || `WhisperX error (${upstream.status})`,
                  upstream_status: upstream.status
                })
                return
              }
              res.writeHead(upstream.status, {
                'Content-Type': upstream.headers.get('content-type') ?? 'application/json'
              })
              res.end(text)
              return
            }

            audio = await readBody(req)
            if (audio.length < 100) {
              json(res, 400, { error: 'Audio chunk too small.' })
              return
            }

            if (contentType.includes('wav')) {
              filename = 'chunk.wav'
              mime = 'audio/wav'
            }

            if (mime.includes('webm') && (await ffmpegAvailable())) {
              try {
                audio = await webmBufferToWav(audio)
                filename = 'chunk.wav'
                mime = 'audio/wav'
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error)
                console.warn(`[whisperx-proxy] webm→wav failed, sending webm as-is: ${message}`)
              }
            }

            const upstream = await forwardToWhisper(whisperBase, audio, filename, mime, fields)
            if (upstream.status < 200 || upstream.status >= 300) {
              console.error(
                `[whisperx-proxy] upstream ${upstream.status}: ${upstream.body.slice(0, 500)}`
              )
              json(res, upstream.status, {
                error: upstream.body || `WhisperX error (${upstream.status})`,
                upstream_status: upstream.status
              })
              return
            }
            res.writeHead(upstream.status, {
              'Content-Type': upstream.contentType ?? 'application/json'
            })
            res.end(upstream.body)
            return
          }

          json(res, 404, { error: 'Not found' })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.error(`[whisperx-proxy] ${message}`)
          json(res, 502, { error: message })
        }
      })
    }
  }
}

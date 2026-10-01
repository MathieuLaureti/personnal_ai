import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, parse, resolve } from 'node:path'
import type { MeetingTranscribeResult, MeetingTurn } from '../../shared/types'

export type MeetingTranscribeOptions = {
  audioPath: string
  minSpeakers?: number
  maxSpeakers?: number
  onLog?: (line: string) => void
}

function repoRoot(): string {
  return resolve(process.cwd())
}

function transcriberDir(): string {
  const fromEnv = process.env.MEETING_TRANSCRIBER_DIR?.trim()
  if (fromEnv) return resolve(fromEnv)
  return join(repoRoot(), 'meeting-transcriber')
}

function pythonExecutable(): string {
  const fromEnv = process.env.MEETING_TRANSCRIBER_PYTHON?.trim()
  if (fromEnv) return fromEnv
  const venv = join(transcriberDir(), '.venv', 'bin', 'python3')
  if (existsSync(venv)) return venv
  return 'python3'
}

function parseTurns(raw: string): MeetingTurn[] {
  const parsed = JSON.parse(raw) as unknown
  if (!Array.isArray(parsed)) {
    throw new Error('Transcriber JSON output was not an array.')
  }
  return parsed.map((entry) => {
    const turn = entry as Record<string, unknown>
    return {
      speaker: String(turn.speaker ?? 'UNKNOWN'),
      start: Number(turn.start ?? 0),
      end: Number(turn.end ?? turn.start ?? 0),
      text: String(turn.text ?? '').trim()
    }
  })
}

export async function runMeetingTranscription(
  options: MeetingTranscribeOptions
): Promise<MeetingTranscribeResult> {
  const audioPath = resolve(options.audioPath)
  const pkgDir = transcriberDir()
  const python = pythonExecutable()
  const outputDir = await mkdtemp(join(tmpdir(), 'personnal-ai-meeting-'))

  const args = [
    '-m',
    'src.cli',
    audioPath,
    '--output-dir',
    outputDir,
    '--format',
    'json'
  ]
  if (options.minSpeakers != null) {
    args.push('--min-speakers', String(options.minSpeakers))
  }
  if (options.maxSpeakers != null) {
    args.push('--max-speakers', String(options.maxSpeakers))
  }

  const log = (line: string): void => {
    options.onLog?.(line)
  }

  try {
    const exitCode = await new Promise<number>((resolvePromise, reject) => {
      const child = spawn(python, args, {
        cwd: pkgDir,
        env: {
          ...process.env,
          PYTHONPATH: pkgDir
        }
      })

      child.stdout?.on('data', (chunk: Buffer) => {
        for (const line of chunk.toString('utf8').split(/\r?\n/)) {
          if (line.trim()) log(line)
        }
      })
      child.stderr?.on('data', (chunk: Buffer) => {
        for (const line of chunk.toString('utf8').split(/\r?\n/)) {
          if (line.trim()) log(line)
        }
      })
      child.on('error', reject)
      child.on('close', (code) => resolvePromise(code ?? 1))
    })

    if (exitCode !== 0) {
      throw new Error(`Meeting transcriber exited with code ${exitCode}.`)
    }

    const stem = parse(audioPath).name
    const jsonPath = join(outputDir, `${stem}.json`)
    const raw = await readFile(jsonPath, 'utf8')
    const turns = parseTurns(raw)
    const plaintext = turns
      .map((turn) => {
        const minutes = Math.floor(turn.start / 60)
        const seconds = Math.floor(turn.start % 60)
        const stamp = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        return `[${stamp}] ${turn.speaker}: ${turn.text}`
      })
      .join('\n')

    return {
      audioPath,
      turns,
      plaintext: plaintext ? `${plaintext}\n` : ''
    }
  } finally {
    await rm(outputDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

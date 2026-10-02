import { realpath, stat } from 'node:fs/promises'
import { isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'

export class SandboxError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SandboxError'
  }
}

export function assertDocsFolder(docsFolder: string): string {
  const root = resolve(docsFolder)
  if (!root) throw new SandboxError('Docs folder is not configured.')
  return root
}

export async function resolveInside(docsFolder: string, requested: string): Promise<string> {
  const root = assertDocsFolder(docsFolder)
  const trimmed = requested.trim().replaceAll('\\', '/')
  if (!trimmed) throw new SandboxError('Path is required.')
  if (isAbsolute(trimmed)) throw new SandboxError('Absolute paths are not allowed. Use a path relative to the docs folder.')
  if (trimmed.startsWith('~')) throw new SandboxError('Home paths are not allowed.')

  const candidate = normalize(join(root, trimmed))
  const rel = relative(root, candidate)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new SandboxError('That path is outside the docs folder.')
  }

  try {
    const existing = await realpath(candidate)
    const rootReal = await realpath(root)
    const existingRel = relative(rootReal, existing)
    if (existingRel.startsWith('..') || isAbsolute(existingRel)) {
      throw new SandboxError('That path is outside the docs folder.')
    }
    return existing
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return candidate
    }
    throw error
  }
}

export function toRel(docsFolder: string, absolutePath: string): string {
  const root = assertDocsFolder(docsFolder)
  const rel = relative(root, absolutePath)
  return rel.split(sep).join('/')
}

export async function ensureDir(absolutePath: string): Promise<void> {
  const info = await stat(absolutePath).catch(() => null)
  if (info && !info.isDirectory()) {
    throw new SandboxError('Expected a directory.')
  }
}

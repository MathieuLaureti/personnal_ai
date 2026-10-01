import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { WRITE_EXTENSIONS } from '../skills/registry'
import { parseDocument } from './parsers'
import { resolveInside, SandboxError, toRel } from './sandbox'

export type ToolDefinition = {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description: string }>
    required: string[]
  }
}

export type ToolCall = {
  id?: string
  name: string
  args: Record<string, unknown>
}

export const noteToolDefinitions: ToolDefinition[] = [
  {
    name: 'list_files',
    description: 'List files and folders inside the docs sandbox. Path is relative to the docs folder. Omit path for the root.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative folder path. Empty or omitted means the docs root.' }
      },
      required: []
    }
  },
  {
    name: 'search_files',
    description: 'Search text-like notes in the docs sandbox for a case-insensitive substring.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text to search for.' },
        path: { type: 'string', description: 'Optional relative folder to limit the search.' }
      },
      required: ['query']
    }
  },
  {
    name: 'read_file',
    description:
      'Read a file in the docs sandbox. The matching document skill is applied from the extension (.pdf → pdf skill, .md → markdown skill, and so on).',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative file path inside the docs folder.' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Create or overwrite a Markdown, text, or JSON note inside the docs sandbox.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative file path ending in .md, .txt, or .json.' },
        content: { type: 'string', description: 'Full file contents to write.' }
      },
      required: ['path', 'content']
    }
  }
]

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

async function walkFiles(root: string, dir: string, acc: string[], depth = 0): Promise<void> {
  if (depth > 8) return
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const absolute = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkFiles(root, absolute, acc, depth + 1)
    } else if (entry.isFile()) {
      acc.push(toRel(root, absolute))
    }
  }
}

export async function executeNoteTool(docsFolder: string, call: ToolCall): Promise<string> {
  try {
    switch (call.name) {
      case 'list_files':
        return await listFiles(docsFolder, asString(call.args.path))
      case 'search_files':
        return await searchFiles(docsFolder, asString(call.args.query), asString(call.args.path))
      case 'read_file':
        return await readSandboxFile(docsFolder, asString(call.args.path))
      case 'write_file':
        return await writeSandboxFile(docsFolder, asString(call.args.path), asString(call.args.content))
      default:
        throw new SandboxError(`Unknown tool: ${call.name}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return `ERROR: ${message}`
  }
}

async function listFiles(docsFolder: string, rel = ''): Promise<string> {
  const dir = await resolveInside(docsFolder, rel || '.')
  const info = await stat(dir).catch(() => null)
  if (!info) return 'Folder does not exist yet. It will be created when a note is written.'
  if (!info.isDirectory()) return 'That path is a file. Use read_file.'

  const entries = await readdir(dir, { withFileTypes: true })
  if (entries.length === 0) return 'Empty folder.'
  return entries
    .map((entry) => `${entry.isDirectory() ? 'dir' : 'file'}\t${entry.name}`)
    .join('\n')
}

async function searchFiles(docsFolder: string, query: string, rel = ''): Promise<string> {
  if (!query.trim()) return 'ERROR: query is required.'
  const start = await resolveInside(docsFolder, rel || '.')
  const info = await stat(start).catch(() => null)
  if (!info) return 'Nothing to search. The folder does not exist yet.'

  const files: string[] = []
  if (info.isFile()) files.push(toRel(docsFolder, start))
  else await walkFiles(docsFolder, start, files)

  const needle = query.toLowerCase()
  const hits: string[] = []
  for (const file of files) {
    const ext = extname(file).toLowerCase()
    if (!['.md', '.txt', '.json', '.csv', '.markdown'].includes(ext)) continue
    const absolute = await resolveInside(docsFolder, file)
    const text = await readFile(absolute, 'utf8')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(needle)) {
        hits.push(`${file}:${index + 1}: ${line.trim()}`)
      }
    })
    if (hits.length > 80) break
  }
  return hits.length ? hits.slice(0, 80).join('\n') : 'No matches.'
}

async function readSandboxFile(docsFolder: string, rel: string): Promise<string> {
  const absolute = await resolveInside(docsFolder, rel)
  const info = await stat(absolute).catch(() => null)
  if (!info) return 'ERROR: File not found.'
  if (!info.isFile()) return 'ERROR: Path is a directory. Use list_files.'

  const bytes = await readFile(absolute)
  const parsed = await parseDocument(absolute, bytes)
  return [
    `skill: ${parsed.kind}`,
    `extension: ${parsed.extension}`,
    `notes: ${parsed.notes}`,
    '',
    '--- skill ---',
    parsed.skill,
    '',
    '--- extracted ---',
    parsed.text || '(empty document)'
  ].join('\n')
}

async function writeSandboxFile(docsFolder: string, rel: string, content: string): Promise<string> {
  const ext = extname(rel).toLowerCase()
  if (!WRITE_EXTENSIONS.has(ext)) {
    return `ERROR: Writes are limited to ${[...WRITE_EXTENSIONS].join(', ')}.`
  }
  const absolute = await resolveInside(docsFolder, rel)
  await mkdir(dirname(absolute), { recursive: true })
  await writeFile(absolute, content, 'utf8')
  return `Wrote ${toRel(docsFolder, absolute)} (${content.length} chars).`
}

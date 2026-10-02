import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export type ParserKind = 'markdown' | 'text' | 'pdf' | 'docx'

export type ParserSkill = {
  kind: ParserKind
  extensions: string[]
  skillPath: string
  title: string
}

const EXT_TO_KIND: Record<string, ParserKind> = {
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.txt': 'text',
  '.json': 'text',
  '.csv': 'text',
  '.pdf': 'pdf',
  '.docx': 'docx'
}

export const WRITE_EXTENSIONS = new Set(['.md', '.txt', '.json'])

export function skillsRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    join(process.cwd(), 'skills'),
    join(here, '../../../skills'),
    join(here, '../../skills'),
    join(here, '../../../../skills')
  ]
  return candidates.find((path) => existsSync(path)) ?? candidates[0]
}

export function kindForExtension(ext: string): ParserKind | null {
  return EXT_TO_KIND[ext.toLowerCase()] ?? null
}

export function skillFile(kind: ParserKind): string {
  return join(skillsRoot(), 'parsers', kind, 'SKILL.md')
}

export async function loadSkillMarkdown(kind: ParserKind): Promise<string> {
  try {
    return await readFile(skillFile(kind), 'utf8')
  } catch {
    return `# ${kind}\n\nNo skill file found. Extract readable text and preserve structure.`
  }
}

export async function catalogSkills(): Promise<string> {
  const kinds: ParserKind[] = ['markdown', 'text', 'pdf', 'docx']
  const lines = await Promise.all(
    kinds.map(async (kind) => {
      const file = skillFile(kind)
      const present = existsSync(file)
      const exts = Object.entries(EXT_TO_KIND)
        .filter(([, value]) => value === kind)
        .map(([ext]) => ext)
        .join(', ')
      return `- ${kind} (${exts})${present ? '' : ' — skill file missing'}`
    })
  )
  return lines.join('\n')
}

import { extname } from 'node:path'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import { kindForExtension, loadSkillMarkdown, type ParserKind } from '../skills/registry'

export type ParsedDocument = {
  kind: ParserKind
  extension: string
  skill: string
  text: string
  notes: string
}

export async function parseDocument(absolutePath: string, bytes: Buffer): Promise<ParsedDocument> {
  const extension = extname(absolutePath).toLowerCase()
  const kind = kindForExtension(extension)
  if (!kind) {
    throw new Error(`No document skill for ${extension || 'this file'}. Add a parser skill before reading it.`)
  }

  const skill = await loadSkillMarkdown(kind)

  if (kind === 'pdf') {
    const parsed = await pdfParse(bytes)
    return {
      kind,
      extension,
      skill,
      text: parsed.text.trim(),
      notes: `PDF pages: ${parsed.numpages}. Text extracted via the pdf skill.`
    }
  }

  if (kind === 'docx') {
    const parsed = await mammoth.extractRawText({ buffer: bytes })
    return {
      kind,
      extension,
      skill,
      text: parsed.value.trim(),
      notes: parsed.messages.length
        ? `DOCX extracted via the docx skill. Warnings: ${parsed.messages.map((m) => m.message).join('; ')}`
        : 'DOCX extracted via the docx skill.'
    }
  }

  const text = bytes.toString('utf8')
  return {
    kind,
    extension,
    skill,
    text,
    notes:
      kind === 'markdown'
        ? 'Markdown kept as source so headings and lists stay intact.'
        : 'Plain text extracted as UTF-8.'
  }
}

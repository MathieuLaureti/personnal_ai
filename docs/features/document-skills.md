# Document skills

## Status
building

## Intent

Document lookup needs real parsing skills so the model understands what it extracts. Skills exist per document type. When the AI has to understand a PDF, it reads the `.pdf` extension and retrieves the PDF skill.

## Behavior

1. `read_file` takes a sandbox-relative path.
2. The extension selects a skill from `skills/parsers/<kind>/SKILL.md`.
3. A matching parser extracts text (PDF, DOCX, Markdown, plain text).
4. The tool result includes the skill name, extension, extraction notes, and the extracted text.

Unknown extensions are refused with a short reason instead of dumping binary.

## Shipped parser skills

- `markdown` — `.md`
- `text` — `.txt`, `.json`, `.csv`
- `pdf` — `.pdf`
- `docx` — `.docx`

## Scope

- Skills teach extraction. They do not widen the filesystem sandbox.
- New file types get a new parser skill plus a parser implementation. Do not invent ad-hoc binary reads in the prompt.

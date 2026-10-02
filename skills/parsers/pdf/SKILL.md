---
name: pdf
description: Extract readable text from PDF files. Use when the file extension is .pdf.
---

# PDF

The tool extracts text page-by-page and concatenates it.

- Layout, columns, and headers/footers may be out of order. Reconstruct meaning, do not assume pixel layout.
- If the extract is empty or mostly garbled, say the PDF is likely scanned/image-only. Do not invent body text.
- Prefer quoting short extracted passages when the user needs accuracy.
- Never try to rewrite the original PDF. If a note is needed, write a Markdown summary in the docs folder.

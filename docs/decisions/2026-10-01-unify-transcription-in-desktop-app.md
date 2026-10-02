# Unify meeting transcription in Personnal AI; retire live-transcribe

## Status
decided

## Context

The repo had three parallel surfaces:

| Surface | Role |
| --- | --- |
| **Personnal AI** (Electron + `npm run ui`) | Main chat and note taker |
| **`meeting-transcriber/`** | GPU batch CLI (WhisperX + diarization) |
| **`live-transcribe/`** | Separate Vite web app: mic/desktop chunks → LAN WhisperX proxy |

`live-transcribe` duplicated the product direction (meeting speech → transcript in a chat-like UI) without living inside the desktop app.

## Decision

1. **Merge** meeting transcription into **Personnal AI** as a first-class capability (not a standalone LAN web app).
2. **Keep** `meeting-transcriber/` as the Python GPU pipeline, invoked from the Electron main process (local batch) with room for LAN WhisperX later via the same app shell—not a second frontend.
3. **Remove** the `live-transcribe/` package entirely (code, root script, docs index). Do not port the separate dev server; reuse only patterns worth keeping (e.g. LAN proxy middleware) inside the main Vite/Electron stack if needed later.
4. **Close** GitHub issue #3 (live transcribe web) as superseded when the removal + integration batch ships.

## Non-goals (this unification)

- Phone-first LAN web UI as its own app
- Maintaining two npm workspaces for transcription

## Follow-up input

Implementation batch: [docs/input/2026-10-01-unify-meeting-transcription.md](../input/2026-10-01-unify-meeting-transcription.md).

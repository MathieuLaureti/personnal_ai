# Live transcribe web app

## Status
retired

## Intent

Web UI reachable from phone on LAN: toggle mic, optional desktop/system audio on PC, live-ish transcription as a chat with Person 1/2/3… in different colors.

## Decision

**Superseded.** The same product direction is handled inside **Personnal AI** with **`meeting-transcriber/`** as the backend—not a standalone `live-transcribe/` app.

See [decisions/2026-10-01-unify-transcription-in-desktop-app.md](../decisions/2026-10-01-unify-transcription-in-desktop-app.md) and [input/2026-10-01-unify-meeting-transcription.md](../input/2026-10-01-unify-meeting-transcription.md).

## Historical behavior (removed)

- Was at `live-transcribe/` (deleted in unification batch).
- Vite on `0.0.0.0:5174`; proxied `/api/transcribe` to `WHISPERX_BASE_URL`.

## Scope

Was standalone; no longer maintained.

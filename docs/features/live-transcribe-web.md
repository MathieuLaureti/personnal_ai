# Live transcribe web app

## Status
building

## Intent

Web UI reachable from phone on LAN: toggle mic, optional desktop/system audio on PC, live-ish transcription as a chat with Person 1/2/3… in different colors.

## Behavior

- App path: [`live-transcribe/`](../../live-transcribe/README.md)
- Vite dev server on `0.0.0.0:5174`; proxies `/api/transcribe` and `/api/health` to `WHISPERX_BASE_URL` (no browser CORS to WhisperX).
- ~8 second audio chunks via `MediaRecorder`; requests serialized to match WhisperX single-GPU lock.
- Speaker labels from diarization map to stable **Person N** colors; without server diarization, speech tends to show as Person 1.
- Desktop audio: `getDisplayMedia` + system audio checkbox (PC browsers only). Default: mic only.

## Scope

- Does not replace Electron chat; standalone tool.
- Real-time streaming STT not in scope (batch chunks only).

## Open questions

- Separate GitHub issue/PR from meeting-transcriber CLI slice.
- Enable server diarization (`HF_TOKEN`) for meaningful multi-person colors.

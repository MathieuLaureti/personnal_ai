# Local meeting-transcriber CLI vs LAN WhisperX API

## Heard on
2026-10-01

## Decision

Two complementary paths for meeting audio:

| Path | When | Where |
| --- | --- | --- |
| **`meeting-transcriber/` Python CLI** | Batch processing on the GPU host with full diarization control (`min_speakers` / `max_speakers`) | Same machine as CUDA (e.g. `lapaella`) |
| **WhisperX HTTP API** (`11436`) | Apps on other LAN devices; no local model load | Client uses `WHISPERX_BASE_URL`; diarization only if server `/health` reports `diarize_available: true` |

Default Whisper model for the CLI: `large-v3-turbo` (overridable via env or `--model`). LAN API today loads `large-v3` on the server — ids may differ between paths.

## Rationale

User handoff specifies env-based LAN URLs for app integration while the task spec requires a standalone GPU pipeline with explicit VRAM management, not only HTTP calls.

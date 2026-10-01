# Meeting transcription & diarization

## Status
building

## Intent

Mathieu asked for a modular Python CLI on the GPU host (`192.168.2.99`, RTX 3060) that ingests meeting audio, runs WhisperX STT + alignment + Pyannote diarization, and exports speaker-attributed transcripts (JSON, plaintext, SRT).

The same LAN also exposes a **WhisperX HTTP API** (`http://192.168.2.99:11436`) for apps that should not load models locally; diarization there requires server-side `HF_TOKEN` and `diarize_available: true` on `/health`.

## Behavior

- Package path: [`meeting-transcriber/`](../../meeting-transcriber/README.md)
- CLI: `python -m src.cli <audio>` from that directory (see package README).
- Sequential GPU stages with model unload + `torch.cuda.empty_cache()` between transcribe, align, and diarize.
- Post-processing merges consecutive turns by the same speaker when the gap is under 1.5 seconds.
- Requires `HF_TOKEN` in `.env` (Pyannote license accepted on Hugging Face).

## Scope

- **Local GPU:** `meeting-transcriber/` on the CUDA host (`ffmpeg`, `HF_TOKEN`, sequential WhisperX + diarization).
- **Desktop app:** Personnal AI **Meeting** tab — **Live** (mic ± desktop audio → LAN WhisperX, chat-style Person 1/2/3 colors) and **Batch file** (local `meeting-transcriber` CLI).
- Does not store secrets in repository `/docs`.
- Optional follow-up: LAN WhisperX HTTP from the same Electron shell (proxy in main/Vite API); optional Ollama summarization of transcript text.

## Open questions

- Whether to add a thin HTTP client mode that uses `WHISPERX_BASE_URL` instead of local WhisperX when `HF_TOKEN` is only on the server.
- Config for Python venv path and “GPU host only” vs “run CLI on this laptop.”

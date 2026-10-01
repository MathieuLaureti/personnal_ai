# Meeting transcription & diarization CLI

## Status
ready-for-github

## Change type
feature

## Summary
Add a modular Python CLI (`meeting-transcriber/`) that runs on the GPU host: WhisperX STT, alignment, Pyannote diarization, and exports JSON / plaintext / SRT.

## Motivation
Batch-process in-person meeting audio on `lapaella` (RTX 3060) with speaker-attributed transcripts, complementing the LAN WhisperX HTTP API for other devices.

## Detailed intent
- Sequential GPU stages with explicit model unload and `torch.cuda.empty_cache()` between transcribe, align, and diarize.
- Config via `.env` (`HF_TOKEN`, `WHISPER_MODEL`, defaults for device/compute/batch).
- CLI: audio path, `--output-dir`, `--format`, `--min-speakers`, `--max-speakers`, `--model`.
- Post-process: merge same-speaker turns when gap &lt; 1.5s.
- Unit tests for postprocessor (no GPU required).

## Acceptance criteria
### Scenario 1 — CLI package layout
- **Given** the repository root
- **When** the feature is merged
- **Then** `meeting-transcriber/` contains `requirements.txt`, `.env.example`, `src/{config,pipeline,postprocessor,cli}.py`, and `tests/test_postprocessor.py`

### Scenario 2 — Postprocessor tests
- **Given** a dev environment with Python 3
- **When** `PYTHONPATH=. python3 -m unittest discover -s tests` runs in `meeting-transcriber/`
- **Then** postprocessor tests pass without CUDA

## Out of scope
- Electron UI integration
- HTTP client mode for `WHISPERX_BASE_URL` (follow-up)
- Committing the rest of the untracked Electron app in this slice

## Notes
- Feature batch: `meeting-transcriber`
- Documented in `docs/features/meeting-transcriber.md`

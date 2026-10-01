# Delivery: unify meeting transcription

## Status
open

## Issue
- Closes #4
- Supersedes #3 (live-transcribe removed)

## Summary
- Removed `live-transcribe/` and root `npm run live-transcribe`.
- Added **Meeting** tab: pick/upload audio, spawn `meeting-transcriber` CLI, show speaker transcript.
- IPC (`meeting:pick-audio`, `meeting:transcribe`) + `/api/meeting/transcribe` for `npm run ui`.

## Test plan
- [x] `npm run typecheck`
- [x] `PYTHONPATH=. python3 -m unittest discover -s tests` in `meeting-transcriber/`
- [ ] Manual: Meeting tab with GPU host + `HF_TOKEN` (CUDA)
- [ ] Manual: `npm run ui` upload audio on WSL

## PR
https://github.com/MathieuLaureti/personnal_ai/pull/2

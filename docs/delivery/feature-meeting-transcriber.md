# Delivery: meeting-transcriber

## Status
pr_open

## Issue
Closes #1

## Summary
Python CLI for WhisperX + Pyannote meeting transcription on the GPU host.

## Test plan
- [x] `PYTHONPATH=. python3 -m unittest discover -s tests -p 'test_*.py'` in `meeting-transcriber/`
- [ ] Manual smoke on GPU host with sample `.wav` and valid `HF_TOKEN`

## PR
https://github.com/MathieuLaureti/personnal_ai/pull/2

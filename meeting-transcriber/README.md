# Meeting transcriber

Local GPU pipeline: **WhisperX** transcription, phoneme alignment, and **Pyannote** speaker diarization. Designed for sequential model loading on a 12 GB GPU (e.g. RTX 3060) with explicit `torch.cuda.empty_cache()` between stages.

For LAN-only STT without running models locally, use the WhisperX HTTP API on the inference host (see [docs/features/meeting-transcriber.md](../docs/features/meeting-transcriber.md)).

## Prerequisites

- Python 3.10+
- `ffmpeg` on `PATH`
- NVIDIA driver + CUDA 12.1-compatible PyTorch (see `requirements.txt`)
- Hugging Face token with access to [pyannote/speaker-diarization-community-1](https://huggingface.co/pyannote/speaker-diarization-community-1)

## Setup

```bash
cd meeting-transcriber
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# set HF_TOKEN in .env
```

## Run

```bash
python3 -m src.cli recording.wav --output-dir ./output --format all
python3 -m src.cli meeting.m4a --min-speakers 2 --max-speakers 6 --model large-v3-turbo
```

Outputs (default `--format all`):

| File | Content |
| --- | --- |
| `*.json` | Speaker turns with `start` / `end` / `text` |
| `*.txt` | `[MM:SS] SPEAKER_xx: …` |
| `*.srt` | SubRip with speaker prefix |

## Tests

```bash
cd meeting-transcriber
python3 -m unittest discover -s tests -p 'test_*.py'
```

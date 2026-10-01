# Personnal AI

Mathieu's personal work AI. First job: a **note taker** that can look up and create files only inside a chosen docs folder.

This is an Electron desktop chat. It streams replies, shows thinking separately, and talks to free/standard APIs — default **Gemma 4 31B** on Gemini (`gemma-4-31b-it`).

## Run

```bash
cp .env.example .env
# put GEMINI_API_KEY in .env
npm install
npm run ui
```

Switch models from the header list, or by editing `"active"` in [`config/models.json`](config/models.json). The catalog already includes Gemma 4 31B / 26B and Gemini 2.5 Flash, Flash-Lite, and Pro.

On WSL, Electron needs system libraries (`libnss3`, GTK, etc.). `npm run dev` is the desktop shell; `npm run ui` is the same chat through a local `/api/chat`.

Use **Node.js 20.12+** (22 LTS recommended). If `npm install` fails on peer deps with Vite 8, run `npm install --legacy-peer-deps`.

## Meeting transcription (GPU)

Batch WhisperX + diarization runs from the **Meeting** tab in the app (Electron or `npm run ui`). The Python CLI lives in [`meeting-transcriber/`](meeting-transcriber/README.md):

```bash
cd meeting-transcriber
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # HF_TOKEN for Pyannote
```

Optional root `.env`: `MEETING_TRANSCRIBER_PYTHON`, `MEETING_TRANSCRIBER_DIR`. LAN HTTP STT is documented in [docs/features/meeting-transcriber.md](docs/features/meeting-transcriber.md).

## Docs

Product decisions, features, and ideas live in [`docs/`](docs/README.md). Project chats are expected to keep that folder current.

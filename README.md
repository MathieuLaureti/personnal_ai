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

## Docs

Product decisions, features, and ideas live in [`docs/`](docs/README.md). Project chats are expected to keep that folder current.

## Meeting transcription (GPU)

Local WhisperX + diarization CLI lives in [`meeting-transcriber/`](meeting-transcriber/README.md). For LAN HTTP STT from other devices, see [docs/features/meeting-transcriber.md](docs/features/meeting-transcriber.md).

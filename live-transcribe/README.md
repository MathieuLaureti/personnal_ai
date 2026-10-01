# Live transcribe (web)

Mobile-friendly LAN web UI: capture **microphone** and optionally **desktop/system audio** (PC browsers), send ~8s chunks to WhisperX via a local proxy, and show a **chat-style transcript** with **Person 1, 2, 3…** in distinct colors when diarization is enabled on the server.

## Setup

```bash
cd live-transcribe
cp .env.example .env
npm install
npm run dev
```

Dev server binds **`0.0.0.0`** (default port **5174**). On your phone (same Wi‑Fi), open:

`http://<your-pc-lan-ip>:5174`

Find the PC IP with `ip addr` / `hostname -I`.

## Controls

| Control | Behavior |
| --- | --- |
| **Microphone** | On by default. Off = do not capture mic (desktop-only mode if enabled). |
| **Desktop audio** | PC only (Chrome/Edge). Uses screen share; user must enable **Share system audio**. |
| **Start / Stop listening** | Starts `MediaRecorder` chunks → `POST /api/transcribe` → WhisperX. |
| **Clear chat** | Resets transcript and speaker → person mapping. |

## Server requirements

- WhisperX at `WHISPERX_BASE_URL` (see `.env`)
- For multi-person colors: `/health` must report `"diarize_available": true` (server `HF_TOKEN`)

Chunks are processed **one at a time** (GPU lock on WhisperX host).

## Production preview

```bash
npm run build
npm run preview
```

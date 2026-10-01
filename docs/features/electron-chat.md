# Electron chat

## Status
building

## Intent

A nice base AI chat as a desktop app. Simple. Not a web-only product.

## Behavior

- Electron + Vite + React desktop shell.
- One window: header, scrolling transcript, composer.
- New chat clears the in-memory transcript.
- The header has a model list from `config/models.json`. Picking one updates `"active"` in that file.
- `.env` holds the key. Catalog entries are still edited in `config/models.json`.
- Replies stream into the last assistant bubble instead of appearing in one shot.
- Provider errors show the error `message` value in a compact callout, not the raw JSON body.

## Scope

- UI and window chrome only. Model calls stay on this machine (Electron main process, or the local `/api/chat` used by `npm run ui`).
- No account system. This is a personal local app.
- `npm run ui` serves the renderer when Electron cannot start. It talks to a local `/api/chat` that uses `.env` and `config/models.json`.

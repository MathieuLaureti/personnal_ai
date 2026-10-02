# Scopes

## Status
decided

## Intent

Clear scopes matter as much as good tools. The note taker is agentic, but it must not become a general filesystem agent.

## Two docs trees

| Tree | Owner | Purpose |
| --- | --- | --- |
| Repository `/docs` | Cursor agents in this project | Trace of features, ideas, scopes, and decisions |
| App **docs folder** | The Electron note-taker agent | The only place that agent may list, read, search, or write |

They are not the same folder unless the user points the app at this repository's `/docs` on purpose.

## Note-taker sandbox

- All file tools resolve paths inside the configured docs folder.
- Path traversal (`..`), absolute paths outside the folder, and symlink escapes are rejected.
- Writes are limited to text note types (`.md`, `.txt`, `.json`).
- Binary documents can be read through a parser skill; they are not rewritten as raw binaries.

## Model origin

- The API key lives in `.env`. The model catalog lives in `config/models.json`. The app can switch `"active"`; it never receives the key.
- The renderer never calls the model provider directly. The main process does.

## Chat documentation scope

- Every product detail mentioned in a Cursor chat about this repo is registered under repository `/docs`.
- Secrets and API keys are never written into `/docs`.

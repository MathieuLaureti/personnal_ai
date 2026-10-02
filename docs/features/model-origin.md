# Model origin

## Status
building

## Intent

Model origin is a config-and-env concern, not an in-app form. The API key lives in `.env`. The active model and the catalog live in `config/models.json`, which is edited in code.

## Behavior

- Copy `.env.example` to `.env` and set `GEMINI_API_KEY` (or `OPENAI_COMPATIBLE_API_KEY` for OpenAI-compatible profiles).
- Add or edit models in `config/models.json`.
- The header lists every catalog model. Changing the picker writes `"active"` back to that file.
- Keys, base URLs, and model ids stay in files. The app only switches which catalog entry is active.
- Each chat turn re-reads `.env` and `config/models.json`.

## Premade catalog

Default active: `gemma-4-31b`.

| Config id | API model | Notes |
| --- | --- | --- |
| `gemma-4-31b` | `gemma-4-31b-it` | First agentic free model |
| `gemma-4-26b` | `gemma-4-26b-a4b-it` | Smaller Gemma 4 |
| `gemini-2.5-flash-lite` | `gemini-2.5-flash-lite` | Most generous free daily quota in the 2.5 family |
| `gemini-2.5-flash` | `gemini-2.5-flash` | Free-tier 2.5 Flash |
| `gemini-2.5-pro` | `gemini-2.5-pro` | Free-tier 2.5 Pro, tighter daily cap |
| `gemini-2.0-flash` | `gemini-2.0-flash` | Gemini 2 request; Google has been shutting 2.0 Flash down |
| `openrouter-gemma-4-31b-free` | `google/gemma-4-31b-it:free` | OpenAI-compatible fallback |

## Scope

- Keys never go in git, `/docs`, or the renderer.
- Docs folder comes from `config/models.json` (`docsFolder`) or `PERSONNAL_AI_DOCS_FOLDER`.

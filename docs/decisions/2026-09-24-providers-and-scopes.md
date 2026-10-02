# Providers and scopes

## Date
2026-09-24

## Decisions

1. **Desktop first.** Electron, not a browser-only app.
2. **Two providers.** Native Gemini REST for Google-hosted Gemma/Gemini, plus OpenAI-compatible for free/standard endpoints such as OpenRouter.
3. **Default model.** `gemma-4-31b-it` on Gemini.
4. **Main process owns secrets and tools.** The renderer only displays chat and settings.
5. **Hard sandbox.** Note-taker file tools stay inside one configured docs folder.
6. **Extension → skill.** Reads go through `skills/parsers/*`, not raw untyped file dumps.
7. **Docs trace is mandatory.** Repository `/docs` is updated in every project chat via a project skill and an always-on Cursor rule.

## Why

Matches the user's request: simple chat, free/standard APIs, Gemma 4 31B, clean streaming/thinking, and strict scopes before a larger agent.

## Follow-up — API key must be used

2026-09-24: The first UI preview answered with a local stub and ignored the key. That stub is removed. Chat always goes through the Gemini / OpenAI-compatible provider using the saved key.

## Follow-up — config in files

2026-09-24: In-app model origin settings were removed. Keys are `.env`. Active model and catalog are `config/models.json`. Chat errors display the provider `message`, not the JSON payload.

The header later gained a model picker so Mathieu can switch the active catalog entry without opening the JSON file. The picker writes `active` only; it does not invent models or store keys.

# Docs

Product record for **personnal_ai**, Mathieu's personal work AI.

Chats in this repository must leave a trace here. The Cursor skill `.cursor/skills/project-docs-trace/` and the always-on rule `.cursor/rules/project-docs-trace.mdc` enforce that.

## Map

| File | What it holds |
| --- | --- |
| [vision.md](vision.md) | Why this app exists and the first goal |
| [scopes.md](scopes.md) | What the agent may touch, and what it must not |
| [features/electron-chat.md](features/electron-chat.md) | Desktop shell and simple chat UI |
| [features/model-origin.md](features/model-origin.md) | `.env` key and `config/models.json` catalog |
| [features/streaming-and-thinking.md](features/streaming-and-thinking.md) | Token streaming and clean thinking |
| [features/note-taker.md](features/note-taker.md) | Agentic note taker and docs-folder tools |
| [features/document-skills.md](features/document-skills.md) | Extension → parser skill lookup |
| [features/custom-user-query.md](features/custom-user-query.md) | JSON-driven ask-user UI (skills, connectors, not Plan-only) |
| [features/meeting-transcriber.md](features/meeting-transcriber.md) | GPU CLI: WhisperX + diarization; LAN API alternative |
| [ideas/2026-09-24-initial-brief.md](ideas/2026-09-24-initial-brief.md) | First-chat brief and parked ideas |
| [ideas/2026-09-24-config-checker.md](ideas/2026-09-24-config-checker.md) | Auto-test catalog models with a tiny prompt |
| [ideas/2026-09-26-cursor-alternative-openrouter.md](ideas/2026-09-26-cursor-alternative-openrouter.md) | Own agent + OpenRouter without Cursor subscription |
| [decisions/2026-09-24-providers-and-scopes.md](decisions/2026-09-24-providers-and-scopes.md) | Provider and sandbox decisions |
| [decisions/2026-09-26-json-user-query-module.md](decisions/2026-09-26-json-user-query-module.md) | Schema-driven queries from any skill or connector |
| [decisions/2026-10-01-meeting-transcriber-local-cli.md](decisions/2026-10-01-meeting-transcriber-local-cli.md) | Local CLI vs LAN WhisperX HTTP for meetings |

## How to add

1. Features and behavior → `docs/features/`
2. Ideas not being built yet → `docs/ideas/YYYY-MM-DD-<slug>.md`
3. Committed choices → `docs/decisions/YYYY-MM-DD-<slug>.md`
4. Link the new file from this index

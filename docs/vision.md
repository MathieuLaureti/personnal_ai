# Vision

## Status
building

## Intent

Build a personal AI for Mathieu's work.

The first goal is a **note taker**: an agentic AI that can look up files and create files in a project, only inside a specific docs folder.

The immediate product need is a **nice base AI chat**. There are many chat modules; this app starts as an Electron desktop chat, then grows tools and skills on a clear scope.

Longer term, Mathieu may use this stack for **agentic work with cheaper models**, **OpenRouter-only billing**, and **more human control** than Cursor’s default automation—see [ideas/2026-09-26-cursor-alternative-openrouter.md](ideas/2026-09-26-cursor-alternative-openrouter.md).

## First slice

1. Electron desktop app
2. Simple chat
3. Settings to enter model origin and API key
4. Works with standard APIs (Gemini) and free APIs
5. Default model path: **Gemma 4 31B** (`gemma-4-31b-it`) because it is strong at agentic work and available free on the Gemini API
6. Stream tokens so the reply builds in the UI
7. Show thinking cleanly, like a real AI chat
8. Keep a `/docs` trace of every feature and idea from project chats
9. **Schema-driven user queries** — JSON (+ in-chat docs) controls ask-user UI; skills and external connections may use it, not only a planning mode (see [features/custom-user-query.md](features/custom-user-query.md))

## Non-goals for this slice

- A large general agent that can touch the whole filesystem
- A heavy paid frontier model as the default
- A web-only app

# Streaming and thinking

## Status
building

## Intent

Thinking should look like a real AI chat. Tokens should generate and stream so the reply builds, instead of a single one-shot text appearance.

## Behavior

- Main process streams provider chunks over IPC: `thinking_delta`, `text_delta`, tool events, `done`, `error`.
- The assistant bubble appends text as tokens arrive.
- Thought parts render in a separate **Thinking** block, not mixed into the answer.
- While thoughts are streaming, the block is open. When the answer starts, the block collapses and can be reopened.
- Provider failures land on the assistant turn as a compact callout. The UI shows the inner error `message` (including nested OpenRouter `metadata.raw`), not the wrapper or the JSON body.

## Scope

- Display only. Thought text is not written to the docs folder unless the user asks to save a note.

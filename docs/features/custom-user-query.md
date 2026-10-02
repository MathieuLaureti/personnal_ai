# Custom user query module

## Status
decided (product direction) · not built

## Intent

Mathieu wants a **customizable user-query system** in the personal app—not Cursor’s fixed “ask user with choices” pattern tied mainly to Plan mode.

Requirements in his terms:

- Query shape is defined by **JSON** plus **documentation shown in chat** so humans and agents share one contract.
- Depending on **JSON format and payload**, the **UI behaves differently** (controls, validation, layout).
- Support multiple **question types**, including at least:
  - **Yes / no**
  - **Multiple choice**
  - **Open question** (free-text reply required)
- **Not limited to planning.** Any agent turn, **skill**, or **external connection** (future MCP/API) should be able to emit a query and block until the user answers (or dismisses per policy).

Cursor’s planning questionnaires feel **too narrow and too automatic**; this app should treat **human input as a first-class, schema-driven channel** with explicit control.

## Behavior (target)

### Protocol

1. Agent runtime (model tool call, skill step, or connector) emits a **`user_query`** payload (exact transport TBD: tool result, structured assistant block, or main→renderer IPC event).
2. Renderer **validates** payload against a documented JSON schema (versioned).
3. Chat renders a **query card** in the transcript: prompt text, optional context/docs markdown, type-specific controls.
4. User submits (or cancels if allowed). Answer is sent back as a structured **`user_query_response`** tied to `queryId`.
5. Loop resumes with the answer in context—no guessing.

### Question types (v1 set)

| `type` | UI | Response shape |
| --- | --- | --- |
| `yes_no` | Two actions or toggle | `{ "value": "yes" \| "no" }` |
| `multiple_choice` | Radio or buttons; optional `allowMultiple` | `{ "selected": string[] }` |
| `open` | Multiline composer; optional `minLength`, `placeholder` | `{ "text": string }` |

Future types (parked): numeric slider, date, file pick (scoped), multi-step wizard (`steps[]`).

### Documentation in chat

Each query may include:

- `title`, `description` (markdown)
- `helpUrl` or inline `schemaDoc` snippet for power users
- `skillId` / `source` (which skill or connector asked)

So the same module teaches its contract in the UI—not only in `/docs`.

### Who may emit queries

| Source | Allowed |
| --- | --- |
| Model via tool (e.g. `ask_user`) | Yes |
| Main-process skill hook | Yes |
| External connection (MCP, webhook, plugin) | Yes, when enrolled and scoped |
| Hard-coded planning mode only | **No** — planning may use the same module, not own it |

## Example payload (illustrative)

```json
{
  "version": 1,
  "queryId": "q_20260926_001",
  "source": { "kind": "skill", "id": "note-taker" },
  "blocks": [
    {
      "type": "yes_no",
      "id": "confirm_write",
      "title": "Write this note?",
      "description": "Will create `ideas/new-topic.md` in your docs folder.",
      "default": "no"
    }
  ],
  "allowCancel": true,
  "timeoutSeconds": null
}
```

Renderer maps `blocks[].type` → component; submission returns:

```json
{
  "queryId": "q_20260926_001",
  "answers": {
    "confirm_write": { "value": "yes" }
  }
}
```

## Scope

- v1: renderer components + main-process validation + one agent tool (`ask_user` or equivalent).
- Queries are **UI-only** until answered; they do not bypass sandbox (note-taker still cannot write without user confirmation if policy requires it).
- Secrets never appear in query JSON stored in notes/logs.

## Non-goals (initial slice)

- Replacing the free-text chat composer for normal messages
- Cursor-style Plan mode as a separate questionnaire system
- Arbitrary executable code in JSON (no `eval`; declarative schema only)

## Open questions

- Single block vs multi-block form in one card?
- Required vs optional `allowCancel` when a tool is blocked?
- Persist unanswered queries across app restart?
- JSON Schema file in repo (`schemas/user-query.v1.json`) vs inline TypeScript types only?

## Related

- [electron-chat.md](electron-chat.md) — transcript and composer
- [note-taker.md](note-taker.md) — first consumer for confirm-before-write
- [scopes.md](../scopes.md) — human gates align with sandbox

## Comparison (Cursor)

| Cursor (today) | personnal_ai (target) |
| --- | --- |
| Choice-style asks; Plan-centric | Schema-driven; any skill/connector |
| Opaque to user contract | JSON + in-chat documentation |
| Product-controlled UX | App-controlled, extensible types |

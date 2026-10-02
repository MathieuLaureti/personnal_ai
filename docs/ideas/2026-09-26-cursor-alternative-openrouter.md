# Cursor-like agent, OpenRouter-only billing

## Status
idea

## Intent

Mathieu’s mental model: a coding agent is mostly an agentic loop plus file/shell/search tools. He wants a **personal version of Cursor** with features he would enjoy, with **OpenRouter** as the model path, without paying **Cursor subscription** on top of API usage.

## Constraint

Using OpenRouter inside Cursor (override base URL / BYOK) still typically requires a **paid Cursor plan** for Agent/Edit with custom keys; OpenRouter usage is billed separately. Cursor-owned models (Composer, Tab) do not run through BYOK. So “OpenRouter only” and “keep paying Cursor” feel redundant for his goal.

## Direction (not decided)

- Continue **personnal_ai**: Electron chat → scoped tools (note taker, docs folder) → optional VS Code–adjacent workflow later.
- Model billing: **OpenRouter + `.env`** and `config/models.json` catalog (already includes `openrouter-gemma-4-31b-free`).
- Replicate Cursor value incrementally: indexing, terminal tools, diff apply, rules/skills — not all at once.

## Economics and control (2026-09-26)

- Rough usage signal: **~400M tokens in two months** on Cursor-style agentic coding — high volume; cost and waste matter.
- Belief: **cheaper / open-weight models** (via OpenRouter or free tiers) can cover much of the same **scoped** agent work (read, search, patch, shell with gates), especially when the agent is not trying to match Tab/Composer on whole-repo autopilot.
- Preference: **narrower capabilities + explicit human control** over Cursor’s more automatic moves (large unsolicited edits, broad repo churn, long unbounded tool loops). Fewer tools and approval steps should cut tokens and surprise, not only API list price.
- **Model routing:** OpenRouter (and the app catalog) allow **cheap/free models by default** and **frontier models when needed**—one key, explicit picker. Cursor’s agent lineup skews **top-tier only**; even the “lightest” option felt like **Composer 2.5**, still frontier-class, with little room to run a small model for simple scoped turns.

## Non-goals (for this idea note)

- Replacing Cursor’s polish (Tab, deep indexing, Bugbot, cloud agents) in one step
- Storing API keys in `/docs` or git

## Related

- [features/model-origin.md](../features/model-origin.md)
- [vision.md](../vision.md)

## Tooling (2026-09-26)

- **`mlaureti-skill-set`** installed at `~/.cursor` (orchestrator, `code-change-pipeline`, `delegate-routing`, etc.). App work in this repo follows that stack; stack file edits only in a `~/.cursor` workspace session.

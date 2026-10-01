# JSON-driven user query module

## Status
decided

## Context

Mathieu wants more **human control** than Cursor’s agent UX. Cursor’s user questions are largely **choice-based** and feel ** tied to planning**, which is too limited for skills and external integrations.

## Decision

1. Build a **first-class user query module** in the Electron app: payload is **versioned JSON**; renderer behavior is driven by **`type`** (and related fields), not hard-coded Plan flows.
2. **Any authorized source** may emit a query: model tools, in-app skills, and future external connections—not a planning-only subsystem.
3. Document the contract in **`/docs/features/custom-user-query.md`** and surface **human-readable docs inside the query card** when useful.

## Consequences

- Agent loop must **pause** until response or explicit cancel policy.
- Skills and connectors need a stable **`ask_user` / `user_query` API** on the main process.
- New question types require schema version bumps and UI components, not one-off chat hacks.

## Related

- [features/custom-user-query.md](../features/custom-user-query.md)

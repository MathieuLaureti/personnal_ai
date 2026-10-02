# Note taker

## Status
building

## Intent

The first job of this personal AI is to be a note taker. It is an agentic AI that can look up files and create files in a project, **only** in a specific docs folder.

## Behavior

Tools exposed to the model:

- `list_files` — list notes under the sandbox
- `search_files` — substring search in text-like notes
- `read_file` — read through the matching document skill
- `write_file` — create or update a text note

The model loops: stream → optional tool calls → scoped execution → stream again.

## Scope

- Tools cannot leave the configured docs folder.
- Writes: `.md`, `.txt`, `.json` only.
- This is not a general coding agent and does not edit the Electron app source.

# Config checker

## Heard on
2026-09-24

## Why it matters

Mathieu wants to test the app by automatically checking whether each config item works.

## Notes

- Send a small test message per catalog model (and maybe per env key) and record pass/fail.
- Not built yet. The catalog in `config/models.json` is the list a checker would iterate.
- Keep keys in `.env`; the checker should only report status, never print secrets.

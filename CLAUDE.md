# CLAUDE.md instructions for /Users/partiu/workspace/amore-couples

Always understand the context of the app: Amore is a day-to-day relationship assistant for couples.

Whenever changing code, ensure it aligns with the application's system design.

## Local Runtime

- Use one web dev server for this repo: the current checkout on `http://localhost:9941`.
- Before starting a server, check and stop stale listeners on `9941`, `9942`, and `9943`.
- Do not leave `.worktrees/autonomous/*` dev servers running when testing current `main`; they can make old code look live.
- If a fallback port appears, treat it as a runtime hygiene issue and return the current checkout to `9941`.

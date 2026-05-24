# Agent Instructions

## Project Overview

EvoSnake is a monorepo for a browser-based snake game and its backend services. The web app is built with Vue 3 and Vite, the API is built with Express, and persistent leaderboard data is stored through Prisma with PostgreSQL.

The game currently includes multiple apple behaviors and live event systems, including Bonus Chain, Gold Rush, and Ice Age. Shared runtime types and difficulty definitions live in the workspace package under `packages/types`.

## Project Structure

```text
project-root/
|-- package.json    # Root scripts and workspace-level dependencies
|-- pnpm-workspace.yaml    # pnpm workspace package definitions
|-- .env.example    # Shared example environment variables
|-- apps/
|   |-- api/    # Express API server
|   `-- web/    # Vue web game
`-- packages/
    |-- configs/  # Shared lint, TypeScript, and tooling config
    `-- types/    # Shared types used by api and web
```

## Operation Rules

- Do not guess.
- Do not hallucinate.
- Be concise.
- For API work, read apps/api/AGENTS.md before making changes.
- For web work, read apps/web/AGENTS.md before making changes.
- If required information is missing, ask before acting.
- If a fact cannot be verified from the repository or provided context, state that it is unknown.
- Do not invent project structure, commands, APIs, files, or behavior.

## Verification Workflow

After modifying code, you must follow the rules and run verifications:

- Run verification scripts from the repository root:
  - `pnpm format`
  - `pnpm lint`
  - `pnpm type-check`
  - `pnpm build`
- If any verification script fails, fix the issue and rerun the failed script.
- After fixing a failed script, continue running the remaining verification scripts.
- Do not claim verification passed unless all required scripts completed successfully.
- If a script cannot be run, state the exact reason.
- Do not skip verification unless explicitly instructed.

# Agent Quickstart

Use this note as a launch pad when working in the Walletfy backend.

## Essential Commands

```bash
npm run dev          # Start the API in watch mode
npm run lint         # Type-aware ESLint
npm run format:check # Prettier validation
npm run build        # TypeScript compilation
npm test             # Jest (unit + e2e)
```

> The Jest suite connects to the MongoDB instance defined in `.env` and clears the `events` collection between runs.

## Where to Go Next

- `docs/architecture.md` – design overview and module relationships
- `docs/development.md` – environment setup, CLI workflow, and alias table
- `src/AGENTS.md` – hands-on guidance for editing application code
- `tests/AGENTS.md` – expectations and patterns for new or existing tests

Keep documentation updates in the same commit as your code changes, and follow the validation workflow (`npm run lint && npm run format:check && npm run build`) before requesting review.

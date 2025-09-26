# Tests Guidance

This guide covers expectations for the Poku suites in `tests/`.

## Running the Suite

```bash
npm test           # runs all specs with Poku (TypeScript via tsx)
```

- Tests automatically load `.env` and expect `MONGODB_URI` + `DB_NAME` to point at a disposable database.
- Prefer `npm run lint` and `npm run build` prior to opening a PR—the CI pipeline matches that sequence.

## Structure & Conventions

- Each file starts with a brief doc comment summarising the scenario under test.
- Use path aliases (`@/...`) rather than relative imports; `tsconfig.json` handles the resolution for both the app and the tests.
- Mock external collaborators at the module boundary—e.g. controller tests mock `@models/event.model`, view helpers, etc.
- Keep assertions focused: validate status codes/payloads for HTTP tests, return values for unit tests, and ensure logger/error interactions are covered where relevant.

## Data & Cleanup

- When creating fixtures, prefer deterministic UUIDs or static payloads so assertions stay stable.
- Remember to reset spies/stubs between tests (`sinon.restore()`), especially when touching the shared logger or console.
- Integration tests seed and delete data through the API—no direct Mongo writes unless the scenario demands it.

## Adding New Tests

- Mirror the folder name of the module under test (e.g. `tests/event.model.test.ts` for `src/models/event.model.ts`).
- Ensure error cases are represented alongside the happy path.
- Update documentation in the same commit when adding new suites.

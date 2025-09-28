# Tests Guidance

This guide covers expectations for the Poku suites in `tests/`.

## Running the Suite

```bash
npm test           # runs all specs with Poku (TypeScript via tsx)
```

- Tests automatically load `.env` and expect `MONGODB_URI` + `DB_NAME` to point at a disposable database.
- Authentication tests require `JWT_SECRET` and `SESSION_SECRET` environment variables.
- Prefer `npm run lint` and `npm run build` prior to opening a PR—the CI pipeline matches that sequence.

## Structure & Conventions

- Each file starts with a brief doc comment summarising the scenario under test.
- Use path aliases (`@/...`) rather than relative imports; `tsconfig.json` handles the resolution for both the app and the tests.
- Mock external collaborators at the module boundary—e.g. controller tests mock `@models/user.model`, auth middleware, etc.
- Keep assertions focused: validate status codes/payloads for HTTP tests, return values for unit tests, and ensure logger/error interactions are covered where relevant.
- Authentication tests mock JWT methods (`jwt.sign`, `jwt.verify`) and bcrypt operations.

## Data & Cleanup

- When creating fixtures, prefer deterministic UUIDs or static payloads so assertions stay stable.
- Remember to reset spies/stubs between tests (`sinon.restore()`), especially when touching JWT methods or shared logger.
- Integration tests seed and delete data through the API—no direct Mongo writes unless the scenario demands it.
- Authentication tests use test-specific JWT secrets and session configurations.

## Adding New Tests

- Mirror the folder name of the module under test (e.g. `tests/user.model.test.ts` for `src/models/user.model.ts`).
- Ensure error cases are represented alongside the happy path.
- For authentication features, test both success and failure scenarios (invalid credentials, missing tokens, etc.).
- Update documentation in the same commit when adding new suites.

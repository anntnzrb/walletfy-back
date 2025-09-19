# Source Code Guidance

This reference outlines expectations for the TypeScript sources inside `src/`.

## MVC Layout

```
Router → Controller → Model ↔ MongoDB
               ↓
             View → JSON response
```

- **Controllers** (`@controllers/`) validate requests with Zod schemas, delegate to models, and translate errors.
- **Models** (`@models/`) wrap Mongoose collections, enforce pagination and sorting, and surface domain objects.
- **Views** (`@views/`) normalise data for outbound JSON (ISO dates, envelope structure).
- **Validators** (`@validators/`) define shared schemas (`EventSchema`, `CreateEventSchema`, `UpdateEventSchema`, `EventQuerySchema`).
- **Core utilities** (`@core/`) handle logging, database bootstrapping, and global middleware.

## Conventions

- Use the configured path aliases (`@/...`) for every import. ESLint blocks `../` relative hops.
- Controllers must raise `NotFoundError` when a requested resource is missing; the global handler converts it to `404`.
- Every exported function or class should carry concise JSDoc explaining purpose and usage.
- Never call `console.*` directly—use the structured logger in `@core/utils/logger`.

## Implementation Notes

- Validate `req.params.id` before invoking a model to guarantee consistent error responses.
- The health endpoint lives in `src/app.ts` and returns `status`, `uptime`, and Mongo connection status.
- Environment variables load via `dotenv/config`; keep secrets out of the repository.

## Tooling Expectations

- TypeScript runs in strict mode with null-safety (`strictNullChecks`, `noUncheckedIndexedAccess`, etc.).
- The project forbids `any`, unsafe casts, and unchecked promises—expect the ESLint `@typescript-eslint/strict-type-checked` preset to flag violations.
- Prefer small, pure helpers; keep business logic inside models or dedicated utilities rather than controllers.

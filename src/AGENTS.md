# Source Code Guidance

This reference outlines expectations for the TypeScript sources inside `src/`.

## MVC Layout

```
Router → Auth Middleware → Controller → Model ↔ MongoDB
                              ↓
                            View → JSON response
```

- **Controllers** (`@controllers/`) validate requests with Zod schemas, delegate to models, and translate errors.
- **Models** (`@models/`) wrap Mongoose collections, enforce pagination and sorting, and surface domain objects.
- **Views** (`@views/`) normalise data for outbound JSON (ISO dates, envelope structure).
- **Validators** (`@validators/`) define shared schemas for both events and authentication.
- **Core utilities** (`@core/`) handle logging, database bootstrapping, authentication middleware, and global error handling.

## Authentication Architecture

### Authentication Flow

```
Request → Auth Middleware → JWT/Session Validation → User Context → Controller
```

### Key Components

- **Auth Controller** (`@controllers/auth.controller`) handles registration, login, profile, and logout
- **Auth Middleware** (`@core/middleware/auth`) provides JWT and session verification
- **User Model** (`@models/user.model`) manages user data with secure password hashing
- **Auth Validators** (`@validators/auth.validator`) define user registration/login schemas
- **Session Types** (`@types/session.d.ts`) extend Express types for authentication context

### Protected Endpoints

All `/eventos/*` endpoints require authentication via the `authenticate` middleware that accepts both JWT and session authentication.

## Conventions

- Use the configured path aliases (`@/...`) for every import. ESLint blocks `../` relative hops.
- Controllers must raise `NotFoundError` when a requested resource is missing; the global handler converts it to `404`.
- Authentication controllers return `401` for invalid credentials and `409` for existing users.
- Every exported function or class should carry concise JSDoc explaining purpose and usage.
- Never call `console.*` directly—use the structured logger in `@core/utils/logger`.
- Authentication middleware sets `req.user` with `{ userId, username }` for downstream controllers.


## Implementation Notes

- Validate `req.params.id` before invoking a model to guarantee consistent error responses.
- The health endpoint lives in `src/app.ts` and returns `status`, `uptime`, and Mongo connection status.
- Environment variables load via `dotenv/config`; keep secrets out of the repository.
- Authentication requires `JWT_SECRET` and `SESSION_SECRET` environment variables.
- User passwords are automatically hashed before saving via Mongoose pre-save hooks.

## Tooling Expectations

- TypeScript runs in strict mode with null-safety (`strictNullChecks`, `noUncheckedIndexedAccess`, etc.).
- The project forbids `any`, unsafe casts, and unchecked promises—expect the ESLint `@typescript-eslint/strict-type-checked` preset to flag violations.
- Prefer small, pure helpers; keep business logic inside models or dedicated utilities rather than controllers.
- Authentication logic is centralized in middleware and controllers, not scattered throughout the codebase.

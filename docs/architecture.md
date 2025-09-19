# Architecture Overview

## High-Level Flow
```
Router → Controller → Model ↔ MongoDB
               ↓
             View → JSON response
```

1. **Routes** wire HTTP paths to controller methods (`src/routes`).
2. **Controllers** validate input with Zod schemas (`src/controllers`, `src/validators`).
3. **Models** encapsulate persistence rules using Mongoose (`src/models`).
4. **Views** shape domain objects into transport-friendly payloads (`src/views`).
5. **Core utilities** host cross-cutting concerns such as logging and error handling (`src/core`).

## Modules at a Glance

- `src/controllers` – Express handlers responsible for coordinating each use case.
- `src/models` – MongoDB access layer with pagination, sorting, and ID generation helpers.
- `src/views` – Pure mappers that normalise date handling and response envelopes.
- `src/validators` – Zod schemas for creation, update, and query parameters.
- `src/core` – Logging, database bootstrapping, and shared middleware.

## Conventions

- **Path aliases**: `@/...` prefixes are defined in `tsconfig.json` for controllers, models, views, validators, routes, and the `core` tree. All code uses these aliases and ESLint blocks `../` imports.
- **Error handling**: Controllers raise domain-specific errors (e.g. `NotFoundError`) which are serialised by the global error middleware.
- **Validation**: Every entry point runs through the appropriate Zod schema before touching the model layer.
- **Testing**: Unit tests focus on controllers, models, and views individually, while end-to-end tests exercise the full HTTP surface against MongoDB.

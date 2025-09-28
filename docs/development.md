# Development Guide

## Prerequisites

- Node.js 22+
- npm
- MongoDB connection string (populate `MONGODB_URI` and `DB_NAME` in `.env`)

## Project Setup

```bash
npm install
cp .env.example .env
```

## Useful Commands

- `npm run dev` – start the development server with hot reload
- `npm run lint` – run ESLint with the strict TypeScript ruleset
- `npm run format:check` – verify Prettier formatting
- `npm run build` – compile TypeScript to `dist/`
- `npm test` – execute the Poku test suite (hits the Mongo instance defined in `.env`)

> The Poku test suite truncates the `events` and `users` collections before and after each run.

## Import Aliases

TypeScript and the testing framework share the alias map defined in `tsconfig.json`:

| Alias           | Resolves To        |
| --------------- | ------------------ |
| `@/`            | `src/`             |
| `@controllers/` | `src/controllers/` |
| `@models/`      | `src/models/`      |
| `@routes/`      | `src/routes/`      |
| `@validators/`  | `src/validators/`  |
| `@views/`       | `src/views/`       |
| `@core/`        | `src/core/`        |

Use these aliases instead of relative paths; ESLint will flag `../` imports.

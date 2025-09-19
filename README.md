# Walletfy Backend

Walletfy is a TypeScript/Express API for managing financial events (`ingreso`/`egreso`) with MongoDB persistence. The project follows a classic MVC structure—controllers handle HTTP flow, models encapsulate persistence logic, and views shape JSON payloads—while enforcing strict typing and validation through Zod.

## Import Aliases

All source files use path aliases configured in `tsconfig.json` (`@/`, `@models/`, etc.) to avoid deep relative imports. ESLint blocks `../` style imports—stick to the aliases when adding new modules.

## Getting Started

### Prerequisites
- Node.js 22+
- npm
- MongoDB connection string

### Installation
```bash
npm install
cp .env.example .env # populate MONGODB_URI and DB_NAME
```

### Development
```bash
npm run dev
```

> Tests connect to the MongoDB URI in `.env` and truncate the `events` collection before/after each run.

## License
GPL-3.0-or-later — see `COPYING`

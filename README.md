# Walletfy Backend

Walletfy is a TypeScript/Express API for managing financial events (`ingreso`/`egreso`) with MongoDB persistence. The project follows Clean Architecture principles and enforces strict typing and validation via Zod.

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

### Scripts
```bash
npm run lint         # ESLint
npm run lint:fix     # ESLint with --fix
npm run format       # Prettier write
npm run format:check # Prettier check
npm run build        # TypeScript build
npm test             # Jest integration/unit suite (uses live MongoDB)
```

> Tests connect to the MongoDB URI in `.env` and truncate the `events` collection before/after each run.

### API
- Health: `GET /health`
- Events: `POST/GET/PUT/DELETE /api/v1/eventos`

### Continuous Integration
GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, format, build, and tests on push/PR. 

## License
GPL-3.0-or-later — see `COPYING`

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

> Tests connect to the MongoDB URI in `.env` and truncate the `events` collection before/after each run.

## License
GPL-3.0-or-later — see `COPYING`

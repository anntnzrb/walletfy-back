# AGENTS.md

This file provides guidance to AI Agents when working with code in this repository.

## Essential Commands

### Development Workflow
```bash
npm run dev          # Start development server with hot reload (tsx watch)
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled application from dist/
```

### Code Quality
```bash
npm run lint         # Run ESLint on all TypeScript files
npm run lint:fix     # Run ESLint with auto-fix enabled
npm run format       # Format code with Prettier
npm run format:check # Check if code is properly formatted
npm test             # Execute Jest end-to-end tests against the API
```

> **Note:** The Jest suite connects to the live MongoDB instance defined in `.env` and truncates the `events` collection before/after each run. Re-seed data manually if you rely on persisted fixtures.

### Validation Workflow
Before committing changes, always run this sequence:
```bash
npm run lint && npm run format:check && npm run build
```

## Architecture Overview

### Clean Architecture Implementation
This codebase follows Clean Architecture principles with Domain-Driven Design patterns:

- **API Layer** (`src/api/events/`): HTTP request handling, validation, and response formatting
- **Core Layer** (`src/core/`): Cross-cutting concerns like middleware and utilities
- **Domain Logic**: Encapsulated within service and repository layers

### Layered Structure
```
Controller → Service → Repository → Data Storage
```

**Controller** (`event.controller.ts`): HTTP request/response handling and input validation using Zod schemas
**Service** (`event.service.ts`): Business logic and orchestration between layers
**Repository** (`event.repository.ts`): Data access abstraction with in-memory storage (currently)

### Key Architectural Patterns

**Schema-First Design**: All data validation is handled through Zod schemas with derived TypeScript types:
- `EventSchema`: Complete event validation
- `CreateEventSchema`: Excludes auto-generated fields (ID)
- `UpdateEventSchema`: All fields optional for partial updates
- `EventQuerySchema`: Pagination and filtering parameters

**Async Route Handling**: All Express routes use `asyncHandler` wrapper to properly handle Promise rejections and prevent unhandled promise errors.

**Structured Logging**: Centralized logging system (`src/core/utils/logger.ts`) with JSON-formatted output and metadata support. Never use `console.*` directly.

**Type Safety**: Zero `any` usage throughout codebase. All functions have explicit return types and parameters.

## Data Models

### Event Entity
Financial events with two types: `ingreso` (income) and `egreso` (expense)

**Required fields**: `nombre`, `cantidad`, `fecha`, `tipo`
**Optional fields**: `descripcion`, `adjunto` (URL)

### Pagination
All list endpoints return `PaginatedResult<T>` with:
- `data`: Array of items
- `total`: Total count across all pages
- `page`: Current page number
- `limit`: Items per page
- `totalPages`: Calculated total pages

## Configuration Standards

### TypeScript Configuration
Strict mode enabled with comprehensive null safety:
- `noImplicitAny`: true
- `strictNullChecks`: true
- `noUncheckedIndexedAccess`: true
- All strict compiler options enabled

### ESLint Configuration
Uses strictest possible TypeScript ESLint rules:
- Type-checked rules enabled (`strict-type-checked`)
- No unsafe operations allowed
- Explicit function return types required
- Consistent type imports enforced

### Error Handling Strategy
- **Zod validation errors**: Return 400 with field-level error details
- **NotFoundError**: Return 404 with descriptive message
- **Unhandled errors**: Return 500 with sanitized error message
- All errors logged with structured metadata

## Important Implementation Notes

### Parameter Validation
Always validate `req.params.id` for undefined before use:
```typescript
const { id } = req.params;
if (!id) {
  res.status(400).json({ error: 'Event ID is required' });
  return;
}
```

### Environment Configuration
Uses `dotenv/config` for environment variables.

### Health Endpoint
`GET /health` returns server status and uptime in seconds.

### API Routing
All event endpoints are exposed under the versioned `/api/v1` prefix
- `POST /api/v1/eventos` - Create event
- `GET /api/v1/eventos` - List events (with pagination/filtering)
- `GET /api/v1/eventos/:id` - Get single event
- `PUT /api/v1/eventos/:id` - Update event
- `DELETE /api/v1/eventos/:id` - Delete event

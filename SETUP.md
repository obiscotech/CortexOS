# CortexOS - Phase 1 Setup

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional for Phase 4+)

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Update database credentials and OpenAI API key

```bash
cp .env.example .env
```

## Database Setup

```bash
npm run db:migrate
```

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## Testing

```bash
npm test
npm run typecheck
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/tasks` - Create task
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks/process` - Process task (async)
- `GET /api/tasks/:id/logs` - Get task logs
- `GET /api/logs` - Get recent logs

## Phase 1 Complete

- Task system with CRUD operations
- Brain Core with planning loop
- Database schema (tasks, steps, memories, logs)
- REST API with Fastify
- OpenAI integration for planning
- Audit logging
- TypeScript type checking
- Unit tests

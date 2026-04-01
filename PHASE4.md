# Phase 4 - Scheduler Complete

## Overview

Task scheduling system with BullMQ for job queuing, delayed execution, recurring tasks, and retry logic.

## Components

### 1. Scheduler Core
Central orchestrator for all scheduling operations:
- Immediate task scheduling
- Delayed task execution
- Recurring task management (cron)
- Job status tracking
- Queue statistics

### 2. Job Queue (BullMQ)
Redis-backed job queue with:
- Priority-based execution (low, normal, high, critical)
- Exponential backoff retry
- Concurrent processing (5 workers)
- Job persistence
- Event listeners

### 3. Cron Schedule Repository
PostgreSQL storage for recurring tasks:
- Cron expression support
- Enable/disable schedules
- Last run and next run tracking
- User-scoped schedules with RLS

## Features

### Immediate Scheduling
```typescript
const jobId = await scheduler.scheduleTask(taskId, userId, {
  priority: 'high',
  maxAttempts: 5
});
```

### Delayed Execution
```typescript
const jobId = await scheduler.scheduleDelayedTask(
  taskId,
  userId,
  5000, // 5 seconds
  { priority: 'normal' }
);
```

### Recurring Tasks (Cron)
```typescript
const result = await scheduler.scheduleRecurringTask(
  'daily-report',
  'Generate daily report',
  userId,
  '0 0 * * *', // Every day at midnight
  { priority: 'normal' }
);
```

### Retry Logic
- Default: 3 attempts
- Exponential backoff: 1s, 2s, 4s, 8s...
- Configurable max attempts
- Failed job tracking

## API Endpoints

- `POST /api/scheduler/schedule` - Schedule immediate task
- `POST /api/scheduler/schedule-delayed` - Schedule delayed task
- `POST /api/scheduler/schedule-recurring` - Schedule recurring task
- `GET /api/scheduler/job/:jobId` - Get job status
- `DELETE /api/scheduler/job/:jobId` - Cancel job
- `GET /api/scheduler/stats` - Queue statistics
- `GET /api/scheduler/cron/:userId` - Get user's cron schedules
- `POST /api/scheduler/cron/:scheduleId/enable` - Enable schedule
- `POST /api/scheduler/cron/:scheduleId/disable` - Disable schedule
- `DELETE /api/scheduler/cron/:scheduleId` - Delete schedule
- `POST /api/scheduler/pause` - Pause scheduler
- `POST /api/scheduler/resume` - Resume scheduler

## Database Schema

### cron_schedules Table
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR)
- task_goal (TEXT)
- cron_expression (VARCHAR)
- user_id (INTEGER)
- enabled (BOOLEAN)
- last_run (TIMESTAMP)
- next_run (TIMESTAMP)
- metadata (JSONB)
- created_at, updated_at
```

### RLS Policies
- Master can see all schedules
- Users can only see/manage their own schedules
- Full CRUD with user isolation

## Job Priorities

1. **Critical** (priority: 1) - Highest
2. **High** (priority: 2)
3. **Normal** (priority: 5) - Default
4. **Low** (priority: 10)

## Queue Configuration

- **Concurrency**: 5 workers
- **Default Attempts**: 3
- **Backoff**: Exponential (1s base)
- **Retention**: 100 completed, 1000 failed
- **Auto-cleanup**: 24 hours for completed jobs

## Event Listeners

- `completed` - Job finished successfully
- `failed` - Job failed after retries
- `error` - Worker error

All events logged to database for audit trail.

## Cron Expression Examples

```
'* * * * *'      - Every minute
'0 * * * *'      - Every hour
'0 0 * * *'      - Every day at midnight
'0 0 * * 0'      - Every Sunday at midnight
'0 9 * * 1-5'    - Weekdays at 9 AM
'*/15 * * * *'   - Every 15 minutes
```

## Configuration

Environment variables:
```
REDIS_URL=redis://localhost:6379
```

## Test Coverage

49 tests passing:
- Immediate scheduling
- Delayed scheduling
- Recurring tasks
- Job status tracking
- Queue statistics
- Cron schedule management

## Usage Example

```typescript
import { SchedulerCore } from './scheduler/core';

const scheduler = new SchedulerCore();

// Schedule immediate
const jobId = await scheduler.scheduleTask(1, 1);

// Schedule delayed (5 minutes)
const delayedId = await scheduler.scheduleDelayedTask(
  1, 1, 300000
);

// Schedule recurring (daily)
const { jobId, scheduleId } = await scheduler.scheduleRecurringTask(
  'daily-backup',
  'Run daily backup',
  1,
  '0 2 * * *'
);

// Get stats
const stats = await scheduler.getQueueStats();
console.log(stats);
// { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 1 }

// Cleanup
await scheduler.close();
```

## Next: Phase 5 - Full Integration
- Connect all modules
- End-to-end workflows
- Integration tests
- Performance optimization

# CortexOS Database Schema Documentation

## Overview

The CortexOS database uses PostgreSQL with Row Level Security (RLS) for fine-grained access control. The schema supports multi-user environments with master users and sub-agents.

## Tables

### 1. users
Stores all users including the master user and sub-agents.

**Columns:**
- `id` (SERIAL PRIMARY KEY) - Unique identifier
- `uuid` (UUID) - Universal unique identifier
- `username` (VARCHAR) - Unique username
- `role` (VARCHAR) - User role: 'master', 'agent', 'sub_agent'
- `api_key` (VARCHAR) - API authentication key
- `permissions` (JSONB) - Permission configuration
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**RLS Policies:**
- Master can see all users
- Users can see themselves
- Self-update allowed

### 2. tasks
Stores all tasks with hierarchical support (parent-child relationships).

**Columns:**
- `id` (SERIAL PRIMARY KEY) - Unique identifier
- `uuid` (UUID) - Universal unique identifier
- `goal` (TEXT) - Task description/goal
- `status` (VARCHAR) - Task status: 'pending', 'planning', 'executing', 'completed', 'failed', 'paused'
- `priority` (INTEGER) - Task priority (higher = more important)
- `parent_task_id` (INTEGER) - Reference to parent task
- `created_by` (INTEGER) - User who created the task
- `assigned_to` (INTEGER) - User assigned to the task
- `metadata` (JSONB) - Additional task metadata
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**RLS Policies:**
- Master can see all tasks
- Users can see tasks they created
- Users can see tasks assigned to them
- Users can create tasks
- Users can update their own or assigned tasks

### 3. steps
Stores individual steps for each task.

**Columns:**
- `id` (SERIAL PRIMARY KEY) - Unique identifier
- `uuid` (UUID) - Universal unique identifier
- `task_id` (INTEGER) - Reference to parent task
- `action` (TEXT) - Step action description
- `status` (VARCHAR) - Step status: 'pending', 'executing', 'completed', 'failed'
- `result` (TEXT) - Step execution result
- `error` (TEXT) - Error message if failed
- `retry_count` (INTEGER) - Number of retry attempts
- `metadata` (JSONB) - Additional step metadata
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**RLS Policies:**
- Master can see all steps
- Users can see steps for tasks they have access to
- Users can create/update steps for their tasks

### 4. memories
Stores agent memories with vector embeddings for semantic search.

**Columns:**
- `id` (SERIAL PRIMARY KEY) - Unique identifier
- `uuid` (UUID) - Universal unique identifier
- `content` (TEXT) - Memory content
- `type` (VARCHAR) - Memory type: 'short_term', 'long_term', 'skill', 'context'
- `embedding` (VECTOR(1536)) - Vector embedding for semantic search
- `score` (FLOAT) - Relevance/importance score
- `task_id` (INTEGER) - Associated task
- `user_id` (INTEGER) - Associated user
- `metadata` (JSONB) - Additional memory metadata
- `created_at` (TIMESTAMP) - Creation timestamp

**RLS Policies:**
- Master can see all memories
- Users can see their own memories
- Users can see memories for tasks they have access to
- Users can create memories

### 5. logs
Audit trail for all system actions.

**Columns:**
- `id` (SERIAL PRIMARY KEY) - Unique identifier
- `uuid` (UUID) - Universal unique identifier
- `task_id` (INTEGER) - Associated task
- `user_id` (INTEGER) - User who performed the action
- `action` (TEXT) - Action description
- `result` (TEXT) - Action result
- `level` (VARCHAR) - Log level: 'info', 'warning', 'error', 'critical'
- `metadata` (JSONB) - Additional log metadata
- `timestamp` (TIMESTAMP) - Log timestamp

**RLS Policies:**
- Master can see all logs
- Users can see logs for tasks they have access to
- Users can see their own logs
- Logs are append-only (no updates/deletes)

## Indexes

Performance indexes are created on:
- Task status, parent_task_id, created_by, assigned_to, created_at
- Step task_id, status, created_at
- Log task_id, user_id, timestamp, level
- Memory type, task_id, user_id, created_at
- User role, uuid

## Triggers

**update_updated_at_column()** - Automatically updates the `updated_at` timestamp on:
- users table
- tasks table
- steps table

## Extensions

- **vector** - For storing and querying embeddings
- **uuid-ossp** - For generating UUIDs

## Default Data

A default master user is created:
- Username: `master`
- Role: `master`
- Permissions: `{"all": true}`

## Security Context

RLS policies use `app.current_user_id` session variable to determine the current user. This must be set before executing queries:

```sql
SELECT set_config('app.current_user_id', '1', true);
```

## Migration

Run the migration script to set up the database:

```bash
npm run db:migrate
```

This will:
1. Create all tables
2. Set up RLS policies
3. Create indexes
4. Set up triggers
5. Insert default master user

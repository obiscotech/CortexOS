# CortexOS Security Model

## Row Level Security (RLS)

CortexOS implements PostgreSQL Row Level Security to ensure data isolation and access control.

## User Roles

1. **master** - Full access to all data and operations
2. **agent** - Standard agent with limited access
3. **sub_agent** - Temporary sub-agent created for specific tasks

## RLS Policies

### Users Table
- Master can see all users
- Users can see themselves
- Users cannot modify other users

### Tasks Table
- Master can see all tasks
- Users can see tasks they created
- Users can see tasks assigned to them
- Users can create tasks
- Users can update their own tasks or assigned tasks

### Steps Table
- Master can see all steps
- Users can see steps for tasks they have access to
- Users can create/update steps for their tasks

### Memories Table
- Master can see all memories
- Users can see their own memories
- Users can see memories for tasks they have access to
- Users can create memories

### Logs Table
- Master can see all logs
- Users can see logs for tasks they have access to
- Users can see their own logs
- Logs are append-only (no updates/deletes)

## Usage in Code

### Setting Security Context

```typescript
import { SecurityContext } from './db/security';
import { pool } from './db/pool';

// Execute query with user context
const result = await SecurityContext.withContext(pool, userId, async (client) => {
  const res = await client.query('SELECT * FROM tasks');
  return res.rows;
});
```

### Repository Pattern with RLS

Repositories should accept an optional userId parameter:

```typescript
async findAll(userId?: number): Promise<Task[]> {
  if (userId) {
    return SecurityContext.withContext(pool, userId, async (client) => {
      const result = await client.query('SELECT * FROM tasks');
      return result.rows;
    });
  }
  // Without context, only public data is returned
  const result = await pool.query('SELECT * FROM tasks');
  return result.rows;
}
```

## Default Master User

A default master user is created during migration:
- Username: `master`
- Role: `master`
- Permissions: `{"all": true}`

## Security Best Practices

1. Always set security context when executing queries on behalf of a user
2. Never expose raw database queries to external APIs without RLS
3. Validate user permissions before allowing operations
4. Use API keys for authentication
5. Log all security-relevant operations
6. Implement rate limiting for API endpoints
7. Use prepared statements to prevent SQL injection
8. Regularly audit access logs

## Permission System

Permissions are stored as JSONB in the users table:

```json
{
  "all": true,  // Master permission
  "tasks": {
    "create": true,
    "read": true,
    "update": true,
    "delete": false
  },
  "tools": {
    "browser": true,
    "terminal": false,
    "file": true
  }
}
```

## Future Enhancements

- OAuth2 integration
- JWT token-based authentication
- Multi-factor authentication
- IP whitelisting
- Session management
- Audit trail encryption

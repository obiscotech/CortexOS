# Phase 3 - Memory System Complete

## Architecture

### Dual Storage Strategy

1. **Pinecone (Short-Term Memory)**
   - Fast, consistent memory for active context
   - User namespace isolation (`user-{userId}`)
   - Automatic cleanup and pruning
   - Optimized for real-time retrieval

2. **Supabase + PostgreSQL (Long-Term Memory)**
   - Persistent storage with RLS
   - Vector similarity search
   - Full audit trail
   - Supports memory types: long_term, skill, context

## Components

### 1. Embedding Service
- OpenAI text-embedding-3-small model
- 1536-dimensional vectors
- Batch embedding support
- Cosine similarity calculation

### 2. Pinecone Client
- Namespace-based user isolation
- Upsert, query, delete operations
- Metadata storage
- Namespace management

### 3. Supabase Vector Client
- RLS-protected vector storage
- Semantic search via match_memories function
- User-scoped queries
- CRUD operations

### 4. Memory Repository
- PostgreSQL memory table access
- Type-based filtering
- User and task associations
- Score tracking

### 5. Memory Core
- Orchestrates all memory operations
- Unified API for short and long-term memory
- Parallel retrieval
- Context-aware storage

## API Endpoints

- `POST /api/memory/store` - Store memory (short or long-term)
- `POST /api/memory/retrieve` - Retrieve memories by query
- `DELETE /api/memory/:memoryId` - Delete specific memory
- `DELETE /api/memory/short-term/:userId` - Clear short-term memory
- `DELETE /api/memory/long-term/:userId` - Clear long-term memory

## Memory Types

- `short_term` - Temporary context (Pinecone)
- `long_term` - Persistent knowledge (Supabase + PostgreSQL)
- `skill` - Learned capabilities
- `context` - Situational awareness

## Security

### Namespace Isolation
Each user has isolated namespace in Pinecone:
```
user-1, user-2, user-3, etc.
```

### RLS Protection
Supabase queries automatically filtered by user_id through RLS policies.

### Vector Search Function
```sql
match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_filter int
)
```

## Usage Example

```typescript
const memoryCore = new MemoryCore();

// Store short-term memory
const id = await memoryCore.storeShortTerm(
  userId,
  'User prefers dark mode',
  { source: 'preference' }
);

// Store long-term memory
const longId = await memoryCore.storeLongTerm(
  userId,
  'Completed Python tutorial',
  'skill',
  taskId
);

// Retrieve relevant memories
const result = await memoryCore.retrieve(
  userId,
  'What programming languages does user know?',
  { shortTermCount: 5, longTermCount: 10 }
);
```

## Test Coverage

42 tests passing:
- Memory storage (short and long-term)
- Memory retrieval with semantic search
- Embedding generation
- Cosine similarity calculation
- User namespace isolation
- Type filtering

## Configuration

Environment variables:
```
PINECONE_API_KEY=your_key
PINECONE_INDEX=cortexos-memory
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
OPENAI_API_KEY=your_key
```

## Next: Phase 4 - Scheduler
- Task scheduling
- Recurring tasks
- Delayed execution
- Retry logic
- Cron-like scheduling

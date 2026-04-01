# CortexOS Quick Start Guide

## Minimum Requirements to Run

### 1. Required Services

**PostgreSQL Database**
```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql

# Start PostgreSQL
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql

# Create database
createdb cortexos

# Run migrations
npm run db:migrate
```

**Redis**
```bash
# Install Redis
# macOS: brew install redis
# Ubuntu: sudo apt install redis-server

# Start Redis
# macOS: brew services start redis
# Ubuntu: sudo systemctl start redis
```

### 2. Required API Keys

**Groq API (Free - Recommended)**
- Sign up at: https://console.groq.com
- Get API key from dashboard
- Add to `.env`: `GROQ_API_KEY=gsk_...`

**Pinecone (Free tier available)**
- Sign up at: https://www.pinecone.io
- Create index: `cortexos-memory`
- Dimensions: 1536
- Metric: cosine
- Add to `.env`: `PINECONE_API_KEY=...`

**Supabase (Free tier available)**
- Sign up at: https://supabase.com
- Create project
- Enable pgvector extension
- Add to `.env`: `SUPABASE_URL=...` and `SUPABASE_KEY=...`

### 3. Start Backend

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start backend server
npm run dev
```

Backend runs on: http://localhost:3000

### 4. Start UI

```bash
# Navigate to UI folder
cd ui

# Install dependencies
npm install

# Start UI dev server
npm run dev
```

UI runs on: http://localhost:3001

## Minimal .env Configuration

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cortexos

# Redis
REDIS_URL=redis://localhost:6379

# LLM (Groq - Free)
DEFAULT_LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=cortexos-memory

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Disable all connectors for testing
MCP_ENABLED=false
ZAPIER_ENABLED=false
MAKE_ENABLED=false
N8N_ENABLED=false
WHATSAPP_ENABLED=false
GMAIL_ENABLED=false
TELEGRAM_ENABLED=false
SLACK_ENABLED=false
WEBHOOK_ENABLED=false
```

## Testing the System

1. Open browser: http://localhost:3001
2. Click "New Task"
3. Enter goal: "Create a test file with hello world"
4. Click "Execute Task"
5. Watch real-time execution

## Troubleshooting

**Database connection error**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run migrations: `npm run db:migrate`

**Redis connection error**
- Check Redis is running: `redis-cli ping`
- Should return: PONG

**LLM API error**
- Verify GROQ_API_KEY is correct
- Check API quota at console.groq.com

**Pinecone error**
- Verify index exists with correct dimensions (1536)
- Check API key is valid

**UI not loading**
- Check backend is running on port 3000
- Check UI is running on port 3001
- Clear browser cache

## Optional: Docker Setup

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d

# This will start:
# - PostgreSQL on port 5432
# - Redis on port 6379
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: cortexos
      POSTGRES_USER: cortex
      POSTGRES_PASSWORD: cortex123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

Then update .env:
```env
DATABASE_URL=postgresql://cortex:cortex123@localhost:5432/cortexos
REDIS_URL=redis://localhost:6379
```

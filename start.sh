#!/bin/bash

echo "🔍 Checking CortexOS Prerequisites..."
echo ""

# Check PostgreSQL
if pg_isready > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is NOT running"
    echo "   Start with: brew services start postgresql (macOS)"
    echo "   Or: sudo systemctl start postgresql (Linux)"
    exit 1
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is NOT running"
    echo "   Start with: brew services start redis (macOS)"
    echo "   Or: sudo systemctl start redis (Linux)"
    exit 1
fi

# Check .env file
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    exit 1
fi

# Check for LLM API key
if grep -q "GROQ_API_KEY=gsk_" .env || \
   grep -q "ANTHROPIC_API_KEY=sk-ant-" .env || \
   grep -q "GEMINI_API_KEY=AI" .env || \
   grep -q "MISTRAL_API_KEY=" .env; then
    echo "✅ LLM API key found"
else
    echo "❌ No valid LLM API key found in .env"
    echo "   Add one of: GROQ_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or MISTRAL_API_KEY"
    exit 1
fi

# Check database exists
if psql -lqt | cut -d \| -f 1 | grep -qw cortexos; then
    echo "✅ Database 'cortexos' exists"
else
    echo "⚠️  Database 'cortexos' not found"
    echo "   Creating database..."
    createdb cortexos
    echo "✅ Database created"
fi

echo ""
echo "✅ All prerequisites met!"
echo ""
echo "Starting backend server..."
npm run dev

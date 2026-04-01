-- Supabase Vector Search Function
-- This function performs cosine similarity search on memory embeddings
-- Run this in your Supabase SQL editor

CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  user_id_filter int DEFAULT NULL
)
RETURNS TABLE (
  id int,
  content text,
  type varchar(50),
  similarity float,
  metadata jsonb,
  task_id int,
  user_id int,
  created_at timestamp
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    memories.id,
    memories.content,
    memories.type,
    1 - (memories.embedding <=> query_embedding) as similarity,
    memories.metadata,
    memories.task_id,
    memories.user_id,
    memories.created_at
  FROM memories
  WHERE 
    (user_id_filter IS NULL OR memories.user_id = user_id_filter)
    AND 1 - (memories.embedding <=> query_embedding) > match_threshold
  ORDER BY memories.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index for faster vector search
CREATE INDEX IF NOT EXISTS memories_embedding_idx ON memories 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_memories TO authenticated;
GRANT EXECUTE ON FUNCTION match_memories TO anon;

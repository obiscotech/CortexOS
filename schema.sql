-- CortexOS Database Schema with Row Level Security
-- Run this file to set up the complete database structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS steps CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (Master and sub-agents)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'agent', -- 'master', 'agent', 'sub_agent'
  api_key VARCHAR(255),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  goal TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Steps table
CREATE TABLE steps (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  result TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Memories table
CREATE TABLE memories (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  embedding vector(1536),
  score FLOAT DEFAULT 0,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs table (Audit trail)
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  result TEXT,
  level VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

CREATE INDEX idx_steps_task ON steps(task_id);
CREATE INDEX idx_steps_status ON steps(status);
CREATE INDEX idx_steps_created_at ON steps(created_at);

CREATE INDEX idx_logs_task ON logs(task_id);
CREATE INDEX idx_logs_user ON logs(user_id);
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_level ON logs(level);

CREATE INDEX idx_memories_type ON memories(type);
CREATE INDEX idx_memories_task ON memories(task_id);
CREATE INDEX idx_memories_user ON memories(user_id);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_uuid ON users(uuid);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Master can see all users
CREATE POLICY users_master_all ON users
  FOR ALL
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::INTEGER 
      AND u.role = 'master'
    )
  );

-- Users can see themselves
CREATE POLICY users_self_select ON users
  FOR SELECT
  TO PUBLIC
  USING (id = current_setting('app.current_user_id')::INTEGER);

-- RLS Policies for tasks table
-- Master can see all tasks
CREATE POLICY tasks_master_all ON tasks
  FOR ALL
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::INTEGER 
      AND u.role = 'master'
    )
  );

-- Users can see tasks they created
CREATE POLICY tasks_creator_select ON tasks
  FOR SELECT
  TO PUBLIC
  USING (created_by = current_setting('app.current_user_id')::INTEGER);

-- Users can see tasks assigned to them
CREATE POLICY tasks_assigned_select ON tasks
  FOR SELECT
  TO PUBLIC
  USING (assigned_to = current_setting('app.current_user_id')::INTEGER);

-- Users can create tasks
CREATE POLICY tasks_create ON tasks
  FOR INSERT
  TO PUBLIC
  WITH CHECK (created_by = current_setting('app.current_user_id')::INTEGER);

-- Users can update their own tasks
CREATE POLICY tasks_update_own ON tasks
  FOR UPDATE
  TO PUBLIC
  USING (
    created_by = current_setting('app.current_user_id')::INTEGER 
    OR assigned_to = current_setting('app.current_user_id')::INTEGER
  );

-- RLS Policies for steps table
-- Master can see all steps
CREATE POLICY steps_master_all ON steps
  FOR ALL
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::INTEGER 
      AND u.role = 'master'
    )
  );

-- Users can see steps for tasks they have access to
CREATE POLICY steps_task_access ON steps
  FOR SELECT
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = steps.task_id 
      AND (
        t.created_by = current_setting('app.current_user_id')::INTEGER 
        OR t.assigned_to = current_setting('app.current_user_id')::INTEGER
      )
    )
  );

-- Users can create steps for their tasks
CREATE POLICY steps_create ON steps
  FOR INSERT
  TO PUBLIC
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = steps.task_id 
      AND (
        t.created_by = current_setting('app.current_user_id')::INTEGER 
        OR t.assigned_to = current_setting('app.current_user_id')::INTEGER
      )
    )
  );

-- Users can update steps for their tasks
CREATE POLICY steps_update ON steps
  FOR UPDATE
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = steps.task_id 
      AND (
        t.created_by = current_setting('app.current_user_id')::INTEGER 
        OR t.assigned_to = current_setting('app.current_user_id')::INTEGER
      )
    )
  );

-- RLS Policies for memories table
-- Master can see all memories
CREATE POLICY memories_master_all ON memories
  FOR ALL
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::INTEGER 
      AND u.role = 'master'
    )
  );

-- Users can see their own memories
CREATE POLICY memories_user_select ON memories
  FOR SELECT
  TO PUBLIC
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Users can see memories for tasks they have access to
CREATE POLICY memories_task_access ON memories
  FOR SELECT
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = memories.task_id 
      AND (
        t.created_by = current_setting('app.current_user_id')::INTEGER 
        OR t.assigned_to = current_setting('app.current_user_id')::INTEGER
      )
    )
  );

-- Users can create memories
CREATE POLICY memories_create ON memories
  FOR INSERT
  TO PUBLIC
  WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

-- RLS Policies for logs table
-- Master can see all logs
CREATE POLICY logs_master_all ON logs
  FOR ALL
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::INTEGER 
      AND u.role = 'master'
    )
  );

-- Users can see logs for tasks they have access to
CREATE POLICY logs_task_access ON logs
  FOR SELECT
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = logs.task_id 
      AND (
        t.created_by = current_setting('app.current_user_id')::INTEGER 
        OR t.assigned_to = current_setting('app.current_user_id')::INTEGER
      )
    )
  );

-- Users can see their own logs
CREATE POLICY logs_user_select ON logs
  FOR SELECT
  TO PUBLIC
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Logs are append-only for users
CREATE POLICY logs_create ON logs
  FOR INSERT
  TO PUBLIC
  WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default master user
INSERT INTO users (username, role, permissions) 
VALUES ('master', 'master', '{"all": true}')
ON CONFLICT (username) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO PUBLIC;

-- Cron Schedules table for recurring tasks
CREATE TABLE IF NOT EXISTS cron_schedules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  task_goal TEXT NOT NULL,
  cron_expression VARCHAR(100) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cron_schedules_user ON cron_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_cron_schedules_enabled ON cron_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_cron_schedules_next_run ON cron_schedules(next_run);

-- Trigger for updated_at
CREATE TRIGGER update_cron_schedules_updated_at BEFORE UPDATE ON cron_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cron_schedules ENABLE ROW LEVEL SECURITY;

-- Master can see all schedules
CREATE POLICY cron_schedules_master_all ON cron_schedules
  FOR ALL
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::INTEGER 
      AND u.role = 'master'
    )
  );

-- Users can see their own schedules
CREATE POLICY cron_schedules_user_select ON cron_schedules
  FOR SELECT
  TO PUBLIC
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Users can create their own schedules
CREATE POLICY cron_schedules_user_insert ON cron_schedules
  FOR INSERT
  TO PUBLIC
  WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

-- Users can update their own schedules
CREATE POLICY cron_schedules_user_update ON cron_schedules
  FOR UPDATE
  TO PUBLIC
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Users can delete their own schedules
CREATE POLICY cron_schedules_user_delete ON cron_schedules
  FOR DELETE
  TO PUBLIC
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

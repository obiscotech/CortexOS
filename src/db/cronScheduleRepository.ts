import { pool } from './pool';

export interface CronSchedule {
  id: number;
  name: string;
  task_goal: string;
  cron_expression: string;
  user_id: number;
  enabled: boolean;
  last_run: Date | null;
  next_run: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export class CronScheduleRepository {
  async create(
    name: string,
    taskGoal: string,
    cronExpression: string,
    userId: number,
    metadata: Record<string, unknown> = {}
  ): Promise<CronSchedule> {
    const result = await pool.query(
      `INSERT INTO cron_schedules (name, task_goal, cron_expression, user_id, metadata) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, taskGoal, cronExpression, userId, JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  async findById(id: number): Promise<CronSchedule | null> {
    const result = await pool.query('SELECT * FROM cron_schedules WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByUser(userId: number): Promise<CronSchedule[]> {
    const result = await pool.query(
      'SELECT * FROM cron_schedules WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async findEnabled(): Promise<CronSchedule[]> {
    const result = await pool.query(
      'SELECT * FROM cron_schedules WHERE enabled = true ORDER BY next_run ASC'
    );
    return result.rows;
  }

  async updateLastRun(id: number, lastRun: Date, nextRun: Date): Promise<CronSchedule> {
    const result = await pool.query(
      'UPDATE cron_schedules SET last_run = $1, next_run = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [lastRun, nextRun, id]
    );
    return result.rows[0];
  }

  async enable(id: number): Promise<CronSchedule> {
    const result = await pool.query(
      'UPDATE cron_schedules SET enabled = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  async disable(id: number): Promise<CronSchedule> {
    const result = await pool.query(
      'UPDATE cron_schedules SET enabled = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM cron_schedules WHERE id = $1', [id]);
  }

  async count(userId?: number): Promise<number> {
    const query = userId
      ? 'SELECT COUNT(*) FROM cron_schedules WHERE user_id = $1'
      : 'SELECT COUNT(*) FROM cron_schedules';
    const params = userId ? [userId] : [];
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

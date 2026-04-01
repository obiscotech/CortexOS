import { pool } from './pool';
import { Log } from '../types/models';

export class LogRepository {
  async create(action: string, result: string | null, taskId?: number, userId?: number, level: string = 'info'): Promise<Log> {
    const query = 'INSERT INTO logs (task_id, user_id, action, result, level) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const queryResult = await pool.query(query, [taskId || null, userId || null, action, result, level]);
    return queryResult.rows[0];
  }

  async findByTaskId(taskId: number): Promise<Log[]> {
    const result = await pool.query(
      'SELECT * FROM logs WHERE task_id = $1 ORDER BY timestamp DESC',
      [taskId]
    );
    return result.rows;
  }

  async findRecent(limit: number = 100): Promise<Log[]> {
    const result = await pool.query(
      'SELECT * FROM logs ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }
}

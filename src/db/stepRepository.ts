import { pool } from './pool';
import { Step, StepStatus } from '../types/models';

export class StepRepository {
  async create(taskId: number, action: string): Promise<Step> {
    const result = await pool.query(
      'INSERT INTO steps (task_id, action) VALUES ($1, $2) RETURNING *',
      [taskId, action]
    );
    return result.rows[0];
  }

  async findByTaskId(taskId: number): Promise<Step[]> {
    const result = await pool.query(
      'SELECT * FROM steps WHERE task_id = $1 ORDER BY created_at ASC',
      [taskId]
    );
    return result.rows;
  }

  async updateStatus(id: number, status: StepStatus, result?: string): Promise<Step> {
    const query = result
      ? 'UPDATE steps SET status = $1, result = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *'
      : 'UPDATE steps SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    
    const params = result ? [status, result, id] : [status, id];
    const queryResult = await pool.query(query, params);
    return queryResult.rows[0];
  }
}

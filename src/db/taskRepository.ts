import { pool } from './pool';
import { Task, TaskStatus } from '../types/models';

export class TaskRepository {
  async create(goal: string, parentTaskId?: number, createdBy?: number): Promise<Task> {
    const result = await pool.query(
      'INSERT INTO tasks (goal, parent_task_id, created_by) VALUES ($1, $2, $3) RETURNING *',
      [goal, parentTaskId || null, createdBy || null]
    );
    return result.rows[0];
  }

  async findById(id: number): Promise<Task | null> {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updateStatus(id: number, status: TaskStatus): Promise<Task> {
    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  async findAll(): Promise<Task[]> {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows;
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    const result = await pool.query('SELECT * FROM tasks WHERE status = $1 ORDER BY created_at DESC', [status]);
    return result.rows;
  }

  async findByUserId(userId: number, limit = 50): Promise<Task[]> {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE created_by = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  }
}

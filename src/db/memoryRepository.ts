import { pool } from './pool';
import { Memory, MemoryType } from '../types/models';

export class MemoryRepository {
  async create(
    content: string,
    type: MemoryType,
    embedding: number[] | null,
    score: number = 0,
    taskId?: number,
    userId?: number,
    metadata: Record<string, unknown> = {}
  ): Promise<Memory> {
    const result = await pool.query(
      `INSERT INTO memories (content, type, embedding, score, task_id, user_id, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [content, type, embedding ? JSON.stringify(embedding) : null, score, taskId || null, userId || null, JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  async findById(id: number): Promise<Memory | null> {
    const result = await pool.query('SELECT * FROM memories WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByUser(userId: number, limit: number = 100): Promise<Memory[]> {
    const result = await pool.query(
      'SELECT * FROM memories WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  }

  async findByTask(taskId: number): Promise<Memory[]> {
    const result = await pool.query(
      'SELECT * FROM memories WHERE task_id = $1 ORDER BY created_at DESC',
      [taskId]
    );
    return result.rows;
  }

  async findByType(type: MemoryType, limit: number = 100): Promise<Memory[]> {
    const result = await pool.query(
      'SELECT * FROM memories WHERE type = $1 ORDER BY created_at DESC LIMIT $2',
      [type, limit]
    );
    return result.rows;
  }

  async updateScore(id: number, score: number): Promise<Memory> {
    const result = await pool.query(
      'UPDATE memories SET score = $1 WHERE id = $2 RETURNING *',
      [score, id]
    );
    return result.rows[0];
  }

  async deleteById(id: number): Promise<void> {
    await pool.query('DELETE FROM memories WHERE id = $1', [id]);
  }

  async deleteByUser(userId: number): Promise<void> {
    await pool.query('DELETE FROM memories WHERE user_id = $1', [userId]);
  }

  async deleteByTask(taskId: number): Promise<void> {
    await pool.query('DELETE FROM memories WHERE task_id = $1', [taskId]);
  }

  async count(userId?: number): Promise<number> {
    const query = userId
      ? 'SELECT COUNT(*) FROM memories WHERE user_id = $1'
      : 'SELECT COUNT(*) FROM memories';
    const params = userId ? [userId] : [];
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

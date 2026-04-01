import { pool } from './pool';
import { User, UserRole } from '../types/models';

export class UserRepository {
  async create(username: string, role: UserRole, permissions: Record<string, unknown> = {}): Promise<User> {
    const result = await pool.query(
      'INSERT INTO users (username, role, permissions) VALUES ($1, $2, $3) RETURNING *',
      [username, role, JSON.stringify(permissions)]
    );
    return result.rows[0];
  }

  async findById(id: number): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  }

  async findByUuid(uuid: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE uuid = $1', [uuid]);
    return result.rows[0] || null;
  }

  async findAll(): Promise<User[]> {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const result = await pool.query('SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC', [role]);
    return result.rows;
  }

  async updatePermissions(id: number, permissions: Record<string, unknown>): Promise<User> {
    const result = await pool.query(
      'UPDATE users SET permissions = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [JSON.stringify(permissions), id]
    );
    return result.rows[0];
  }

  async setApiKey(id: number, apiKey: string): Promise<User> {
    const result = await pool.query(
      'UPDATE users SET api_key = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [apiKey, id]
    );
    return result.rows[0];
  }

  async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

import { Pool, PoolClient } from 'pg';

export class SecurityContext {
  /**
   * Set the current user context for Row Level Security
   * This must be called before any queries that need RLS enforcement
   */
  static async setContext(client: PoolClient, userId: number): Promise<void> {
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId.toString()]);
  }

  /**
   * Clear the current user context
   */
  static async clearContext(client: PoolClient): Promise<void> {
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', '']);
  }

  /**
   * Execute a query with a specific user context
   */
  static async withContext<T>(
    pool: Pool,
    userId: number,
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await SecurityContext.setContext(client, userId);
      return await callback(client);
    } finally {
      await SecurityContext.clearContext(client);
      client.release();
    }
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export class SupabaseVectorClient {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.SUPABASE_KEY || 'test-key';
    
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async insert(
    userId: number,
    content: string,
    embedding: number[],
    type: string,
    metadata: Record<string, unknown> = {}
  ): Promise<{ id: number; uuid: string }> {
    const { data, error } = await this.client
      .from('memories')
      .insert({
        user_id: userId,
        content,
        embedding,
        type,
        metadata,
      })
      .select('id, uuid')
      .single();

    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
    return data;
  }

  async search(
    userId: number,
    queryEmbedding: number[],
    limit: number = 10,
    type?: string
  ): Promise<Array<{
    id: number;
    content: string;
    type: string;
    similarity: number;
    metadata: Record<string, unknown>;
  }>> {
    let query = this.client.rpc('match_memories', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
      user_id_filter: userId,
    });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Supabase search failed: ${error.message}`);
    return data || [];
  }

  async getById(memoryId: number): Promise<{
    id: number;
    content: string;
    type: string;
    embedding: number[];
    metadata: Record<string, unknown>;
  } | null> {
    const { data, error } = await this.client
      .from('memories')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (error) return null;
    return data;
  }

  async deleteById(memoryId: number): Promise<void> {
    const { error } = await this.client
      .from('memories')
      .delete()
      .eq('id', memoryId);

    if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  }

  async deleteByUser(userId: number): Promise<void> {
    const { error } = await this.client
      .from('memories')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  }
}

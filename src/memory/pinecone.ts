import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

export class PineconeClient {
  private client: Pinecone;
  private indexName: string;

  constructor() {
    this.client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || 'test-key',
    });
    this.indexName = process.env.PINECONE_INDEX || 'cortexos-memory';
  }

  async upsert(
    userId: number,
    vectors: Array<{
      id: string;
      values: number[];
      metadata: Record<string, unknown>;
    }>
  ): Promise<void> {
    const index = this.client.index(this.indexName);
    const namespace = `user-${userId}`;

    await index.namespace(namespace).upsert(vectors as any);
  }

  async query(
    userId: number,
    vector: number[],
    topK: number = 5,
    filter?: Record<string, unknown>
  ): Promise<Array<{
    id: string;
    score: number;
    metadata: Record<string, unknown>;
  }>> {
    const index = this.client.index(this.indexName);
    const namespace = `user-${userId}`;

    const results = await index.namespace(namespace).query({
      vector,
      topK,
      includeMetadata: true,
      filter,
    });

    return results.matches.map(match => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata || {},
    }));
  }

  async delete(userId: number, ids: string[]): Promise<void> {
    const index = this.client.index(this.indexName);
    const namespace = `user-${userId}`;

    await index.namespace(namespace).deleteMany(ids);
  }

  async deleteNamespace(userId: number): Promise<void> {
    const index = this.client.index(this.indexName);
    const namespace = `user-${userId}`;

    await index.namespace(namespace).deleteAll();
  }

  async listNamespaces(): Promise<string[]> {
    const index = this.client.index(this.indexName);
    const stats = await index.describeIndexStats();
    return Object.keys(stats.namespaces || {});
  }
}

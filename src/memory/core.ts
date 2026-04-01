import { PineconeClient } from './pinecone';
import { SupabaseVectorClient } from './supabase';
import { EmbeddingService } from './embedding';
import { MemoryRepository } from '../db/memoryRepository';
import { MemoryType } from '../types/models';

export interface MemoryItem {
  id: string;
  content: string;
  type: MemoryType;
  score: number;
  metadata: Record<string, unknown>;
}

export class MemoryCore {
  private pinecone: PineconeClient;
  private supabase: SupabaseVectorClient;
  private embedding: EmbeddingService;
  private memoryRepo: MemoryRepository;

  constructor() {
    this.pinecone = new PineconeClient();
    this.supabase = new SupabaseVectorClient();
    this.embedding = new EmbeddingService();
    this.memoryRepo = new MemoryRepository();
  }

  async storeShortTerm(
    userId: number,
    content: string,
    metadata: Record<string, unknown> = {}
  ): Promise<string> {
    const vector = await this.embedding.generateEmbedding(content);
    const id = `short-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await this.pinecone.upsert(userId, [
      {
        id,
        values: vector,
        metadata: {
          content,
          type: 'short_term',
          userId,
          timestamp: Date.now(),
          ...metadata,
        },
      },
    ]);

    return id;
  }

  async storeLongTerm(
    userId: number,
    content: string,
    type: MemoryType = 'long_term',
    taskId?: number,
    metadata: Record<string, unknown> = {}
  ): Promise<number> {
    const vector = await this.embedding.generateEmbedding(content);

    const result = await this.supabase.insert(userId, content, vector, type, metadata);

    await this.memoryRepo.create(
      content,
      type,
      vector,
      0,
      taskId,
      userId,
      metadata
    );

    return result.id;
  }

  async retrieveShortTerm(
    userId: number,
    query: string,
    topK: number = 5
  ): Promise<MemoryItem[]> {
    const queryVector = await this.embedding.generateEmbedding(query);

    const results = await this.pinecone.query(userId, queryVector, topK);

    return results.map(result => ({
      id: result.id,
      content: (result.metadata.content as string) || '',
      type: 'short_term' as MemoryType,
      score: result.score,
      metadata: result.metadata,
    }));
  }

  async retrieveLongTerm(
    userId: number,
    query: string,
    limit: number = 10,
    type?: MemoryType
  ): Promise<MemoryItem[]> {
    const queryVector = await this.embedding.generateEmbedding(query);

    const results = await this.supabase.search(userId, queryVector, limit, type);

    return results.map(result => ({
      id: result.id.toString(),
      content: result.content,
      type: result.type as MemoryType,
      score: result.similarity,
      metadata: result.metadata,
    }));
  }

  async retrieve(
    userId: number,
    query: string,
    options: {
      shortTermCount?: number;
      longTermCount?: number;
      type?: MemoryType;
    } = {}
  ): Promise<{ shortTerm: MemoryItem[]; longTerm: MemoryItem[] }> {
    const { shortTermCount = 5, longTermCount = 10, type } = options;

    const [shortTerm, longTerm] = await Promise.all([
      this.retrieveShortTerm(userId, query, shortTermCount),
      this.retrieveLongTerm(userId, query, longTermCount, type),
    ]);

    return { shortTerm, longTerm };
  }

  async clearShortTerm(userId: number): Promise<void> {
    await this.pinecone.deleteNamespace(userId);
  }

  async clearLongTerm(userId: number): Promise<void> {
    await this.supabase.deleteByUser(userId);
    await this.memoryRepo.deleteByUser(userId);
  }

  async deleteMemory(userId: number, memoryId: string, isShortTerm: boolean): Promise<void> {
    if (isShortTerm) {
      await this.pinecone.delete(userId, [memoryId]);
    } else {
      const id = parseInt(memoryId);
      await this.supabase.deleteById(id);
      await this.memoryRepo.deleteById(id);
    }
  }

  getEmbeddingService(): EmbeddingService {
    return this.embedding;
  }
}

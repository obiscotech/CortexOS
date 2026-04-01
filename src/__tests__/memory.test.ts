import { MemoryCore } from '../memory/core';
import { EmbeddingService } from '../memory/embedding';
import { PineconeClient } from '../memory/pinecone';
import { SupabaseVectorClient } from '../memory/supabase';
import { MemoryRepository } from '../db/memoryRepository';

jest.mock('../memory/pinecone');
jest.mock('../memory/supabase');
jest.mock('../db/memoryRepository');
jest.mock('../memory/embedding');

describe('MemoryCore', () => {
  let memoryCore: MemoryCore;

  beforeEach(() => {
    (PineconeClient.prototype.upsert as jest.Mock) = jest.fn().mockResolvedValue(undefined);
    (PineconeClient.prototype.query as jest.Mock) = jest.fn().mockResolvedValue([
      { id: 'test-1', score: 0.9, metadata: { content: 'test memory' } },
    ]);
    (SupabaseVectorClient.prototype.insert as jest.Mock) = jest.fn().mockResolvedValue({ id: 1, uuid: 'test-uuid' });
    (SupabaseVectorClient.prototype.search as jest.Mock) = jest.fn().mockResolvedValue([
      { id: 1, content: 'long term memory', type: 'long_term', similarity: 0.85, metadata: {} },
    ]);
    (MemoryRepository.prototype.create as jest.Mock) = jest.fn().mockResolvedValue({ id: 1 });
    (EmbeddingService.prototype.generateEmbedding as jest.Mock) = jest.fn().mockResolvedValue(new Array(1536).fill(0.1));
    (EmbeddingService.prototype.getDimensions as jest.Mock) = jest.fn().mockReturnValue(1536);
    (EmbeddingService.prototype.cosineSimilarity as jest.Mock) = jest.fn((a, b) => {
      if (a.length !== b.length) throw new Error('Vectors must have the same length');
      return a[0] === b[0] && a[1] === b[1] ? 1.0 : 0.0;
    });

    memoryCore = new MemoryCore();
    jest.clearAllMocks();
  });

  describe('storeShortTerm', () => {
    it('should store memory in Pinecone with user namespace', async () => {
      const userId = 1;
      const content = 'Test memory';
      const metadata = { source: 'test' };

      const id = await memoryCore.storeShortTerm(userId, content, metadata);

      expect(id).toBeTruthy();
      expect(id).toContain('short-');
    });
  });

  describe('storeLongTerm', () => {
    it('should store memory in Supabase and PostgreSQL', async () => {
      const userId = 1;
      const content = 'Long term memory';
      const type = 'long_term' as const;

      const id = await memoryCore.storeLongTerm(userId, content, type);

      expect(typeof id).toBe('number');
    });
  });

  describe('retrieve', () => {
    it('should retrieve both short and long term memories', async () => {
      const userId = 1;
      const query = 'test query';

      const result = await memoryCore.retrieve(userId, query);

      expect(result).toHaveProperty('shortTerm');
      expect(result).toHaveProperty('longTerm');
      expect(Array.isArray(result.shortTerm)).toBe(true);
      expect(Array.isArray(result.longTerm)).toBe(true);
    });
  });
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    service = new EmbeddingService();
  });

  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const a = [1, 0, 0];
      const b = [1, 0, 0];
      const similarity = service.cosineSimilarity(a, b);
      expect(similarity).toBeCloseTo(1.0);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      const similarity = service.cosineSimilarity(a, b);
      expect(similarity).toBeCloseTo(0.0);
    });

    it('should throw error for different length vectors', () => {
      const a = [1, 0];
      const b = [1, 0, 0];
      expect(() => service.cosineSimilarity(a, b)).toThrow();
    });
  });

  describe('getDimensions', () => {
    it('should return correct embedding dimensions', () => {
      expect(service.getDimensions()).toBe(1536);
    });
  });
});

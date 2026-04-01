// Pinecone handles embeddings internally when using their inference API
// For local embeddings or custom models, we can use alternative services

export class EmbeddingService {
  private dimensions = 1536;

  // Pinecone will handle embeddings via their inference API
  // This is a placeholder for when we need local embedding generation
  async generateEmbedding(_text: string): Promise<number[]> {
    // In production, Pinecone's inference API handles this
    // For testing, return mock embedding
    if (process.env.NODE_ENV === 'test') {
      return new Array(this.dimensions).fill(0.1);
    }

    throw new Error(
      'Embedding generation should be handled by Pinecone inference API. ' +
      'Use Pinecone client directly for production embeddings.'
    );
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (process.env.NODE_ENV === 'test') {
      return texts.map(() => new Array(this.dimensions).fill(0.1));
    }

    throw new Error(
      'Batch embedding generation should be handled by Pinecone inference API.'
    );
  }

  getDimensions(): number {
    return this.dimensions;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

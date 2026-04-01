import { FastifyInstance } from 'fastify';
import { MemoryCore } from '../memory/core';
import { z } from 'zod';

const storeMemorySchema = z.object({
  userId: z.number(),
  content: z.string().min(1),
  type: z.enum(['short_term', 'long_term', 'skill', 'context']),
  taskId: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const retrieveMemorySchema = z.object({
  userId: z.number(),
  query: z.string().min(1),
  shortTermCount: z.number().optional(),
  longTermCount: z.number().optional(),
  type: z.enum(['short_term', 'long_term', 'skill', 'context']).optional(),
});

const deleteMemorySchema = z.object({
  userId: z.number(),
  memoryId: z.string(),
  isShortTerm: z.boolean(),
});

export function registerMemoryRoutes(fastify: FastifyInstance, memoryCore: MemoryCore) {
  // Store memory
  fastify.post('/api/memory/store', async (request, reply) => {
    const body = storeMemorySchema.parse(request.body);

    if (body.type === 'short_term') {
      const id = await memoryCore.storeShortTerm(
        body.userId,
        body.content,
        body.metadata
      );
      return reply.code(201).send({ id, type: 'short_term' });
    } else {
      const id = await memoryCore.storeLongTerm(
        body.userId,
        body.content,
        body.type,
        body.taskId,
        body.metadata
      );
      return reply.code(201).send({ id, type: body.type });
    }
  });

  // Retrieve memories
  fastify.post('/api/memory/retrieve', async (request) => {
    const body = retrieveMemorySchema.parse(request.body);

    const result = await memoryCore.retrieve(body.userId, body.query, {
      shortTermCount: body.shortTermCount,
      longTermCount: body.longTermCount,
      type: body.type,
    });

    return {
      shortTerm: result.shortTerm,
      longTerm: result.longTerm,
      total: result.shortTerm.length + result.longTerm.length,
    };
  });

  // Delete memory
  fastify.delete('/api/memory/:memoryId', async (request, reply) => {
    const params = request.params as { memoryId: string };
    const body = request.body as { userId: number; isShortTerm: boolean };
    
    const validated = deleteMemorySchema.parse({
      userId: body.userId,
      memoryId: params.memoryId,
      isShortTerm: body.isShortTerm,
    });

    await memoryCore.deleteMemory(validated.userId, validated.memoryId, validated.isShortTerm);
    return reply.code(204).send();
  });

  // Clear short-term memory
  fastify.delete('/api/memory/short-term/:userId', async (request, reply) => {
    const userId = parseInt((request.params as { userId: string }).userId);
    await memoryCore.clearShortTerm(userId);
    return reply.code(204).send();
  });

  // Clear long-term memory
  fastify.delete('/api/memory/long-term/:userId', async (request, reply) => {
    const userId = parseInt((request.params as { userId: string }).userId);
    await memoryCore.clearLongTerm(userId);
    return reply.code(204).send();
  });
}

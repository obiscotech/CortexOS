import { FastifyInstance } from 'fastify';
import { CortexOS } from '../integration/cortex';
import { z } from 'zod';

const executeTaskSchema = z.object({
  goal: z.string().min(1),
  userId: z.number(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  useMemory: z.boolean().optional(),
  storeMemory: z.boolean().optional(),
  parentTaskId: z.number().optional(),
});

const executeDelayedSchema = z.object({
  goal: z.string().min(1),
  userId: z.number(),
  delayMs: z.number().min(0),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  useMemory: z.boolean().optional(),
});

const executeRecurringSchema = z.object({
  name: z.string().min(1),
  goal: z.string().min(1),
  userId: z.number(),
  cronExpression: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  storeMemory: z.boolean().optional(),
});

const searchMemorySchema = z.object({
  userId: z.number(),
  query: z.string().min(1),
  shortTermCount: z.number().optional(),
  longTermCount: z.number().optional(),
  type: z.enum(['short_term', 'long_term', 'skill', 'context']).optional(),
});

const storeSkillSchema = z.object({
  userId: z.number(),
  skillName: z.string().min(1),
  skillDescription: z.string().min(1),
  taskId: z.number().optional(),
});

const executeToolSchema = z.object({
  toolName: z.string().min(1),
  params: z.record(z.unknown()),
  userId: z.number(),
  taskId: z.number().optional(),
});

export function registerCortexRoutes(fastify: FastifyInstance, cortex: CortexOS) {
  // Execute task with full workflow
  fastify.post('/api/cortex/execute', async (request, reply) => {
    const body = executeTaskSchema.parse(request.body);

    const result = await cortex.executeTask(body.goal, body.userId, {
      priority: body.priority,
      useMemory: body.useMemory,
      storeMemory: body.storeMemory,
      parentTaskId: body.parentTaskId,
    });

    return reply.code(201).send(result);
  });

  // Execute delayed task
  fastify.post('/api/cortex/execute-delayed', async (request, reply) => {
    const body = executeDelayedSchema.parse(request.body);

    const result = await cortex.executeDelayedTask(
      body.goal,
      body.userId,
      body.delayMs,
      {
        priority: body.priority,
        useMemory: body.useMemory,
      }
    );

    return reply.code(201).send(result);
  });

  // Execute recurring task
  fastify.post('/api/cortex/execute-recurring', async (request, reply) => {
    const body = executeRecurringSchema.parse(request.body);

    const result = await cortex.executeRecurringTask(
      body.name,
      body.goal,
      body.userId,
      body.cronExpression,
      {
        priority: body.priority,
        storeMemory: body.storeMemory,
      }
    );

    return reply.code(201).send(result);
  });

  // Get task status
  fastify.get<{ Params: { taskId: string } }>('/api/cortex/task/:taskId', async (request, reply) => {
    const taskId = parseInt(request.params.taskId);
    const status = await cortex.getTaskStatus(taskId);

    if (!status.task) {
      return reply.code(404).send({ error: 'Task not found' });
    }

    return status;
  });

  // Search memory
  fastify.post('/api/cortex/memory/search', async (request) => {
    const body = searchMemorySchema.parse(request.body);

    const result = await cortex.searchMemory(body.userId, body.query, {
      shortTermCount: body.shortTermCount,
      longTermCount: body.longTermCount,
      type: body.type,
    });

    return result;
  });

  // Store skill
  fastify.post('/api/cortex/skill', async (request, reply) => {
    const body = storeSkillSchema.parse(request.body);

    const memoryId = await cortex.storeSkill(
      body.userId,
      body.skillName,
      body.skillDescription,
      body.taskId
    );

    return reply.code(201).send({ memoryId });
  });

  // Execute tool
  fastify.post('/api/cortex/tool', async (request) => {
    const body = executeToolSchema.parse(request.body);

    const result = await cortex.executeTool(
      body.toolName,
      body.params,
      body.userId,
      body.taskId
    );

    return result;
  });

  // Get system status
  fastify.get('/api/cortex/status', async () => {
    const status = await cortex.getSystemStatus();
    return status;
  });

  // Shutdown
  fastify.post('/api/cortex/shutdown', async (_request, reply) => {
    await cortex.shutdown();
    return reply.code(200).send({ message: 'System shutdown initiated' });
  });
}

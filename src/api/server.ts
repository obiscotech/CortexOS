import Fastify from 'fastify';
import cors from '@fastify/cors';
import { BrainCore } from '../core/brain';
import { TaskRepository } from '../db/taskRepository';
import { LogRepository } from '../db/logRepository';
import { MemoryCore } from '../memory/core';
import { SchedulerCore } from '../scheduler/core';
import { CortexOS } from '../integration/cortex';
import { ConnectorManager } from '../connectors/manager';
import { LearningCore } from '../learning/core';
import { registerMemoryRoutes } from './memory';
import { registerSchedulerRoutes } from './scheduler';
import { registerCortexRoutes } from './cortex';
import { connectorRoutes } from './connectors';
import { learningRoutes } from './learning';
import { z } from 'zod';

const fastify = Fastify({ logger: true });
const brain = new BrainCore();
const taskRepo = new TaskRepository();
const logRepo = new LogRepository();
const memoryCore = new MemoryCore();
const schedulerCore = new SchedulerCore();

// Initialize connector manager
const connectorManager = new ConnectorManager({
  mcp: {
    config: {
      enabled: process.env.MCP_ENABLED === 'true',
      credentials: {},
    },
    servers: JSON.parse(process.env.MCP_SERVERS || '{}'),
  },
  zapier: {
    enabled: process.env.ZAPIER_ENABLED === 'true',
    credentials: { webhookUrl: process.env.ZAPIER_WEBHOOK_URL || '' },
  },
  make: {
    enabled: process.env.MAKE_ENABLED === 'true',
    credentials: { webhookUrl: process.env.MAKE_WEBHOOK_URL || '' },
  },
  n8n: {
    enabled: process.env.N8N_ENABLED === 'true',
    credentials: { webhookUrl: process.env.N8N_WEBHOOK_URL || '' },
  },
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === 'true',
    credentials: {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    },
  },
  gmail: {
    enabled: process.env.GMAIL_ENABLED === 'true',
    credentials: {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
    },
  },
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED === 'true',
    credentials: { botToken: process.env.TELEGRAM_BOT_TOKEN || '' },
  },
  slack: {
    enabled: process.env.SLACK_ENABLED === 'true',
    credentials: { botToken: process.env.SLACK_BOT_TOKEN || '' },
  },
  webhook: {
    config: {
      enabled: process.env.WEBHOOK_ENABLED === 'true',
      credentials: {},
    },
    webhooks: JSON.parse(process.env.WEBHOOKS || '{}'),
  },
});

const cortexOS = new CortexOS(connectorManager);
const learningCore = new LearningCore();

// Schemas
const createTaskSchema = z.object({
  goal: z.string().min(1),
  parentTaskId: z.number().optional(),
});

const processTaskSchema = z.object({
  taskId: z.number(),
});

export async function buildServer() {
  await fastify.register(cors);

  // Initialize connectors
  await connectorManager.initialize();

  // Register memory routes
  registerMemoryRoutes(fastify, memoryCore);

  // Register scheduler routes
  registerSchedulerRoutes(fastify, schedulerCore);

  // Register unified CortexOS routes
  registerCortexRoutes(fastify, cortexOS);

  // Register connector routes
  await connectorRoutes(fastify, connectorManager);

  // Register learning routes
  await learningRoutes(fastify, learningCore);

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Create task
  fastify.post('/api/tasks', async (request, reply) => {
    const body = createTaskSchema.parse(request.body);
    const task = await brain.createTask(body.goal, body.parentTaskId);
    return reply.code(201).send(task);
  });

  // Get task
  fastify.get<{ Params: { id: string } }>('/api/tasks/:id', async (request, reply) => {
    const taskId = parseInt(request.params.id);
    const task = await brain.getTask(taskId);
    
    if (!task) {
      return reply.code(404).send({ error: 'Task not found' });
    }

    const steps = await brain.getTaskSteps(taskId);
    return { task, steps };
  });

  // List all tasks
  fastify.get('/api/tasks', async () => {
    const tasks = await taskRepo.findAll();
    return { tasks };
  });

  // Process task
  fastify.post('/api/tasks/process', async (request, reply) => {
    const body = processTaskSchema.parse(request.body);
    
    // Process async
    brain.processTask(body.taskId).catch(err => {
      console.error('Task processing error:', err);
    });

    return reply.code(202).send({ message: 'Task processing started' });
  });

  // Get logs
  fastify.get<{ Params: { id: string } }>('/api/tasks/:id/logs', async (request) => {
    const taskId = parseInt(request.params.id);
    const logs = await logRepo.findByTaskId(taskId);
    return { logs };
  });

  // Recent logs
  fastify.get('/api/logs', async () => {
    const logs = await logRepo.findRecent(50);
    return { logs };
  });

  // List tools
  fastify.get('/api/tools', async () => {
    const tools = brain.getToolRegistry().listTools();
    return { tools };
  });

  // Execute tool
  fastify.post('/api/tools/execute', async (request, reply) => {
    const body = request.body as {
      toolName: string;
      params: Record<string, unknown>;
      taskId: number;
      userId?: number;
    };

    const userId = body.userId || 1;
    const task = await brain.getTask(body.taskId);
    
    if (!task) {
      return reply.code(404).send({ error: 'Task not found' });
    }

    const result = await brain.getToolRegistry().execute(
      body.toolName,
      body.params,
      { taskId: body.taskId, userId, permissions: { all: true } }
    );

    return result;
  });

  return fastify;
}

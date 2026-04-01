import { FastifyInstance } from 'fastify';
import { SchedulerCore } from '../scheduler/core';
import { z } from 'zod';

const scheduleTaskSchema = z.object({
  taskId: z.number(),
  userId: z.number(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  delay: z.number().optional(),
  maxAttempts: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const scheduleRecurringSchema = z.object({
  name: z.string().min(1),
  taskGoal: z.string().min(1),
  userId: z.number(),
  cronExpression: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export function registerSchedulerRoutes(fastify: FastifyInstance, scheduler: SchedulerCore) {
  // Schedule immediate task
  fastify.post('/api/scheduler/schedule', async (request, reply) => {
    const body = scheduleTaskSchema.parse(request.body);

    const jobId = await scheduler.scheduleTask(body.taskId, body.userId, {
      priority: body.priority,
      maxAttempts: body.maxAttempts,
      metadata: body.metadata,
    });

    return reply.code(201).send({ jobId });
  });

  // Schedule delayed task
  fastify.post('/api/scheduler/schedule-delayed', async (request, reply) => {
    const body = scheduleTaskSchema.parse(request.body);

    if (!body.delay) {
      return reply.code(400).send({ error: 'delay is required' });
    }

    const jobId = await scheduler.scheduleDelayedTask(
      body.taskId,
      body.userId,
      body.delay,
      {
        priority: body.priority,
        maxAttempts: body.maxAttempts,
        metadata: body.metadata,
      }
    );

    return reply.code(201).send({ jobId, delayMs: body.delay });
  });

  // Schedule recurring task
  fastify.post('/api/scheduler/schedule-recurring', async (request, reply) => {
    const body = scheduleRecurringSchema.parse(request.body);

    const result = await scheduler.scheduleRecurringTask(
      body.name,
      body.taskGoal,
      body.userId,
      body.cronExpression,
      {
        priority: body.priority,
        metadata: body.metadata,
      }
    );

    return reply.code(201).send(result);
  });

  // Get job status
  fastify.get<{ Params: { jobId: string } }>('/api/scheduler/job/:jobId', async (request, reply) => {
    const { jobId } = request.params;
    const job = await scheduler.getJob(jobId);

    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    const state = await job.getState();
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    };
  });

  // Cancel job
  fastify.delete<{ Params: { jobId: string } }>('/api/scheduler/job/:jobId', async (request, reply) => {
    const { jobId } = request.params;
    await scheduler.cancelJob(jobId);
    return reply.code(204).send();
  });

  // Get queue statistics
  fastify.get('/api/scheduler/stats', async () => {
    const stats = await scheduler.getQueueStats();
    return { stats };
  });

  // Get cron schedules
  fastify.get<{ Params: { userId: string } }>('/api/scheduler/cron/:userId', async (request) => {
    const userId = parseInt(request.params.userId);
    const schedules = await scheduler.getCronSchedules(userId);
    return { schedules };
  });

  // Enable cron schedule
  fastify.post<{ Params: { scheduleId: string } }>('/api/scheduler/cron/:scheduleId/enable', async (request, reply) => {
    const scheduleId = parseInt(request.params.scheduleId);
    await scheduler.enableCronSchedule(scheduleId);
    return reply.code(200).send({ message: 'Schedule enabled' });
  });

  // Disable cron schedule
  fastify.post<{ Params: { scheduleId: string } }>('/api/scheduler/cron/:scheduleId/disable', async (request, reply) => {
    const scheduleId = parseInt(request.params.scheduleId);
    await scheduler.disableCronSchedule(scheduleId);
    return reply.code(200).send({ message: 'Schedule disabled' });
  });

  // Delete cron schedule
  fastify.delete<{ Params: { scheduleId: string } }>('/api/scheduler/cron/:scheduleId', async (request, reply) => {
    const scheduleId = parseInt(request.params.scheduleId);
    await scheduler.deleteCronSchedule(scheduleId);
    return reply.code(204).send();
  });

  // Pause scheduler
  fastify.post('/api/scheduler/pause', async (_request, reply) => {
    await scheduler.pauseScheduler();
    return reply.code(200).send({ message: 'Scheduler paused' });
  });

  // Resume scheduler
  fastify.post('/api/scheduler/resume', async (_request, reply) => {
    await scheduler.resumeScheduler();
    return reply.code(200).send({ message: 'Scheduler resumed' });
  });
}

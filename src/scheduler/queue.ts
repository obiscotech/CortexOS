import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { JobOptions, JobPriority } from '../types/scheduler';
import { BrainCore } from '../core/brain';
import { LogRepository } from '../db/logRepository';
import dotenv from 'dotenv';

dotenv.config();

export class JobQueue {
  private queue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;
  private brain: BrainCore;
  private logRepo: LogRepository;
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue('cortexos-tasks', {
      connection: this.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 1000,
        },
      },
    });

    this.brain = new BrainCore();
    this.logRepo = new LogRepository();

    this.worker = new Worker(
      'cortexos-tasks',
      async (job: Job) => this.processJob(job),
      {
        connection: this.redis,
        concurrency: 5,
      }
    );

    this.queueEvents = new QueueEvents('cortexos-tasks', {
      connection: this.redis,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.worker.on('completed', async (job: Job) => {
      await this.logRepo.create(
        `Job completed: ${job.id}`,
        JSON.stringify(job.returnvalue),
        job.data.taskId,
        job.data.userId,
        'info'
      );
    });

    this.worker.on('failed', async (job: Job | undefined, err: Error) => {
      if (job) {
        await this.logRepo.create(
          `Job failed: ${job.id}`,
          err.message,
          job.data.taskId,
          job.data.userId,
          'error'
        );
      }
    });

    this.worker.on('error', (err: Error) => {
      console.error('Worker error:', err);
    });
  }

  async addJob(
    taskId: number,
    userId: number,
    options?: JobOptions
  ): Promise<string> {
    const job = await this.queue.add(
      'process-task',
      { taskId, userId },
      {
        priority: this.getPriorityValue(options?.priority),
        delay: options?.delay,
        attempts: options?.maxAttempts || 3,
        backoff: options?.backoff || {
          type: 'exponential',
          delay: 1000,
        },
      }
    );

    await this.logRepo.create(
      `Job scheduled: ${job.id}`,
      `Task ${taskId} scheduled`,
      taskId,
      userId,
      'info'
    );

    return job.id || '';
  }

  async addDelayedJob(
    taskId: number,
    userId: number,
    delayMs: number,
    options?: JobOptions
  ): Promise<string> {
    return this.addJob(taskId, userId, { ...options, delay: delayMs });
  }

  async addRecurringJob(
    name: string,
    taskGoal: string,
    userId: number,
    cronExpression: string,
    options?: JobOptions
  ): Promise<string> {
    const job = await this.queue.add(
      'recurring-task',
      { taskGoal, userId, name },
      {
        repeat: {
          pattern: cronExpression,
        },
        priority: this.getPriorityValue(options?.priority),
      }
    );

    await this.logRepo.create(
      `Recurring job created: ${name}`,
      `Cron: ${cronExpression}`,
      undefined,
      userId,
      'info'
    );

    return job.id || '';
  }

  private async processJob(job: Job): Promise<void> {
    const { taskId, userId, taskGoal } = job.data;

    await this.logRepo.create(
      `Processing job: ${job.id}`,
      `Attempt ${job.attemptsMade + 1}`,
      taskId,
      userId,
      'info'
    );

    if (taskGoal) {
      const task = await this.brain.createTask(taskGoal, undefined, userId);
      await this.brain.processTask(task.id, userId);
    } else if (taskId) {
      await this.brain.processTask(taskId, userId);
    }
  }

  private getPriorityValue(priority?: JobPriority): number {
    const priorityMap: Record<JobPriority, number> = {
      low: 10,
      normal: 5,
      high: 2,
      critical: 1,
    };
    return priorityMap[priority || 'normal'];
  }

  async getJob(jobId: string): Promise<Job | undefined> {
    return this.queue.getJob(jobId);
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
      await this.logRepo.create(
        `Job cancelled: ${jobId}`,
        null,
        undefined,
        undefined,
        'warning'
      );
    }
  }

  async getJobCounts(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const counts = await this.queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  }

  async pauseQueue(): Promise<void> {
    await this.queue.pause();
  }

  async resumeQueue(): Promise<void> {
    await this.queue.resume();
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.queueEvents.close();
    await this.redis.quit();
  }
}

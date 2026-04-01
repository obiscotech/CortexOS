import { JobQueue } from './queue';
import { CronScheduleRepository } from '../db/cronScheduleRepository';
import { JobOptions } from '../types/scheduler';
import { Job } from 'bullmq';

export class SchedulerCore {
  private jobQueue: JobQueue;
  private cronRepo: CronScheduleRepository;

  constructor() {
    this.jobQueue = new JobQueue();
    this.cronRepo = new CronScheduleRepository();
  }

  async scheduleTask(
    taskId: number,
    userId: number,
    options?: JobOptions
  ): Promise<string> {
    return this.jobQueue.addJob(taskId, userId, options);
  }

  async scheduleDelayedTask(
    taskId: number,
    userId: number,
    delayMs: number,
    options?: JobOptions
  ): Promise<string> {
    return this.jobQueue.addDelayedJob(taskId, userId, delayMs, options);
  }

  async scheduleRecurringTask(
    name: string,
    taskGoal: string,
    userId: number,
    cronExpression: string,
    options?: JobOptions
  ): Promise<{ jobId: string; scheduleId: number }> {
    const schedule = await this.cronRepo.create(
      name,
      taskGoal,
      cronExpression,
      userId,
      options?.metadata || {}
    );

    const jobId = await this.jobQueue.addRecurringJob(
      name,
      taskGoal,
      userId,
      cronExpression,
      options
    );

    return { jobId, scheduleId: schedule.id };
  }

  async cancelJob(jobId: string): Promise<void> {
    await this.jobQueue.cancelJob(jobId);
  }

  async getJob(jobId: string): Promise<Job | undefined> {
    return this.jobQueue.getJob(jobId);
  }

  async getJobStatus(jobId: string): Promise<string | null> {
    const job = await this.jobQueue.getJob(jobId);
    if (!job) return null;
    return await job.getState();
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return this.jobQueue.getJobCounts();
  }

  async pauseScheduler(): Promise<void> {
    await this.jobQueue.pauseQueue();
  }

  async resumeScheduler(): Promise<void> {
    await this.jobQueue.resumeQueue();
  }

  async getCronSchedules(userId: number) {
    return this.cronRepo.findByUser(userId);
  }

  async enableCronSchedule(scheduleId: number): Promise<void> {
    await this.cronRepo.enable(scheduleId);
  }

  async disableCronSchedule(scheduleId: number): Promise<void> {
    await this.cronRepo.disable(scheduleId);
  }

  async deleteCronSchedule(scheduleId: number): Promise<void> {
    await this.cronRepo.delete(scheduleId);
  }

  async close(): Promise<void> {
    await this.jobQueue.close();
  }
}

import { SchedulerCore } from '../scheduler/core';
import { JobQueue } from '../scheduler/queue';
import { CronScheduleRepository } from '../db/cronScheduleRepository';

jest.mock('../scheduler/queue');
jest.mock('../db/cronScheduleRepository');
jest.mock('../core/brain');
jest.mock('../db/logRepository');
jest.mock('../llm/manager', () => ({
  llmManager: {
    generateJSON: jest.fn().mockResolvedValue({
      content: JSON.stringify({ steps: [] }),
      model: 'test-model',
    }),
  },
}));

describe('SchedulerCore', () => {
  let scheduler: SchedulerCore;

  beforeEach(() => {
    (JobQueue.prototype.addJob as jest.Mock) = jest.fn().mockResolvedValue('job-123');
    (JobQueue.prototype.addDelayedJob as jest.Mock) = jest.fn().mockResolvedValue('job-456');
    (JobQueue.prototype.addRecurringJob as jest.Mock) = jest.fn().mockResolvedValue('job-789');
    (JobQueue.prototype.getJob as jest.Mock) = jest.fn().mockResolvedValue({
      id: 'job-123',
      data: { taskId: 1, userId: 1 },
      getState: jest.fn().mockResolvedValue('completed'),
    });
    (JobQueue.prototype.getJobCounts as jest.Mock) = jest.fn().mockResolvedValue({
      waiting: 5,
      active: 2,
      completed: 100,
      failed: 3,
      delayed: 1,
    });
    (CronScheduleRepository.prototype.create as jest.Mock) = jest.fn().mockResolvedValue({
      id: 1,
      name: 'test-schedule',
    });
    (CronScheduleRepository.prototype.findByUser as jest.Mock) = jest.fn().mockResolvedValue([]);

    scheduler = new SchedulerCore();
    jest.clearAllMocks();
  });

  describe('scheduleTask', () => {
    it('should schedule immediate task', async () => {
      const jobId = await scheduler.scheduleTask(1, 1);
      expect(jobId).toBe('job-123');
      expect(JobQueue.prototype.addJob).toHaveBeenCalledWith(1, 1, undefined);
    });

    it('should schedule task with options', async () => {
      const options = { priority: 'high' as const, maxAttempts: 5 };
      await scheduler.scheduleTask(1, 1, options);
      expect(JobQueue.prototype.addJob).toHaveBeenCalledWith(1, 1, options);
    });
  });

  describe('scheduleDelayedTask', () => {
    it('should schedule delayed task', async () => {
      const jobId = await scheduler.scheduleDelayedTask(1, 1, 5000);
      expect(jobId).toBe('job-456');
      expect(JobQueue.prototype.addDelayedJob).toHaveBeenCalledWith(1, 1, 5000, undefined);
    });
  });

  describe('scheduleRecurringTask', () => {
    it('should schedule recurring task', async () => {
      const result = await scheduler.scheduleRecurringTask(
        'daily-task',
        'Run daily report',
        1,
        '0 0 * * *'
      );

      expect(result).toEqual({ jobId: 'job-789', scheduleId: 1 });
      expect(CronScheduleRepository.prototype.create).toHaveBeenCalled();
      expect(JobQueue.prototype.addRecurringJob).toHaveBeenCalled();
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = await scheduler.getQueueStats();
      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
      });
    });
  });

  describe('getJob', () => {
    it('should get job by id', async () => {
      const job = await scheduler.getJob('job-123');
      expect(job).toBeDefined();
      expect(job?.id).toBe('job-123');
    });
  });

  describe('getCronSchedules', () => {
    it('should get user cron schedules', async () => {
      const schedules = await scheduler.getCronSchedules(1);
      expect(schedules).toEqual([]);
      expect(CronScheduleRepository.prototype.findByUser).toHaveBeenCalledWith(1);
    });
  });
});

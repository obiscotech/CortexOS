import { CortexOS } from '../integration/cortex';
import { ConnectorManager } from '../connectors/manager';
import { BrainCore } from '../core/brain';
import { MemoryCore } from '../memory/core';
import { SchedulerCore } from '../scheduler/core';

jest.mock('../core/brain');
jest.mock('../memory/core');
jest.mock('../scheduler/core');
jest.mock('../connectors/manager');
jest.mock('../tools/registry', () => ({
  ToolRegistry: jest.fn().mockImplementation(() => ({
    listTools: jest.fn().mockReturnValue([{ name: 'browser', description: 'Browser tool' }]),
  })),
}));
jest.mock('../db/taskRepository', () => ({
  TaskRepository: jest.fn().mockImplementation(() => ({
    findByStatus: jest.fn().mockResolvedValue([]),
  })),
}));
jest.mock('../db/logRepository');
jest.mock('../db/userRepository');
jest.mock('../llm/manager', () => ({
  llmManager: {
    generateJSON: jest.fn().mockResolvedValue({
      content: JSON.stringify({ steps: [] }),
      model: 'test-model',
    }),
  },
}));

describe('CortexOS Integration', () => {
  let cortex: CortexOS;
  let mockConnectorManager: jest.Mocked<ConnectorManager>;

  beforeEach(() => {
    mockConnectorManager = new ConnectorManager({}) as jest.Mocked<ConnectorManager>;
    mockConnectorManager.shutdown = jest.fn().mockResolvedValue(undefined);

    (BrainCore.prototype.createTask as jest.Mock) = jest.fn().mockResolvedValue({
      id: 1,
      goal: 'Test task',
      status: 'pending',
    });
    (BrainCore.prototype.processTask as jest.Mock) = jest.fn().mockResolvedValue(undefined);
    (BrainCore.prototype.getTask as jest.Mock) = jest.fn().mockResolvedValue({
      id: 1,
      goal: 'Test task',
      status: 'completed',
    });
    (BrainCore.prototype.getTaskSteps as jest.Mock) = jest.fn().mockResolvedValue([]);

    (MemoryCore.prototype.retrieve as jest.Mock) = jest.fn().mockResolvedValue({
      shortTerm: [],
      longTerm: [],
    });
    (MemoryCore.prototype.storeShortTerm as jest.Mock) = jest.fn().mockResolvedValue('mem-123');
    (MemoryCore.prototype.storeLongTerm as jest.Mock) = jest.fn().mockResolvedValue(1);

    (SchedulerCore.prototype.scheduleTask as jest.Mock) = jest.fn().mockResolvedValue('job-123');
    (SchedulerCore.prototype.scheduleDelayedTask as jest.Mock) = jest.fn().mockResolvedValue('job-456');
    (SchedulerCore.prototype.scheduleRecurringTask as jest.Mock) = jest.fn().mockResolvedValue({
      jobId: 'job-789',
      scheduleId: 1,
    });
    (SchedulerCore.prototype.getQueueStats as jest.Mock) = jest.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    });

    cortex = new CortexOS(mockConnectorManager);
    jest.clearAllMocks();
  });

  describe('executeTask', () => {
    it('should execute task with full workflow', async () => {
      const result = await cortex.executeTask('Test goal', 1);

      expect(result.task).toBeDefined();
      expect(result.task.id).toBe(1);
      expect(BrainCore.prototype.createTask).toHaveBeenCalledWith('Test goal', undefined, 1);
      expect(BrainCore.prototype.processTask).toHaveBeenCalledWith(1, 1);
      expect(SchedulerCore.prototype.scheduleTask).toHaveBeenCalled();
    });

    it('should use memory when enabled', async () => {
      await cortex.executeTask('Test goal', 1, { useMemory: true });

      expect(MemoryCore.prototype.retrieve).toHaveBeenCalledWith(1, 'Test goal', {
        shortTermCount: 3,
        longTermCount: 5,
      });
    });

    it('should store memory when enabled', async () => {
      await cortex.executeTask('Test goal', 1, { storeMemory: true });

      expect(MemoryCore.prototype.storeShortTerm).toHaveBeenCalled();
    });

    it('should handle priority', async () => {
      await cortex.executeTask('Test goal', 1, { priority: 'high' });

      expect(SchedulerCore.prototype.scheduleTask).toHaveBeenCalledWith(
        1,
        1,
        { priority: 'high' }
      );
    });
  });

  describe('executeDelayedTask', () => {
    it('should schedule delayed task', async () => {
      const result = await cortex.executeDelayedTask('Test goal', 1, 5000);

      expect(result.taskId).toBe(1);
      expect(result.jobId).toBe('job-456');
      expect(SchedulerCore.prototype.scheduleDelayedTask).toHaveBeenCalledWith(
        1,
        1,
        5000,
        { priority: undefined }
      );
    });
  });

  describe('executeRecurringTask', () => {
    it('should schedule recurring task', async () => {
      const result = await cortex.executeRecurringTask(
        'daily-task',
        'Run daily',
        1,
        '0 0 * * *'
      );

      expect(result.jobId).toBe('job-789');
      expect(result.scheduleId).toBe(1);
      expect(SchedulerCore.prototype.scheduleRecurringTask).toHaveBeenCalled();
    });
  });

  describe('getTaskStatus', () => {
    it('should get complete task status', async () => {
      const status = await cortex.getTaskStatus(1);

      expect(status.task).toBeDefined();
      expect(status.steps).toEqual([]);
      expect(BrainCore.prototype.getTask).toHaveBeenCalledWith(1);
      expect(BrainCore.prototype.getTaskSteps).toHaveBeenCalledWith(1);
    });

    it('should handle non-existent task', async () => {
      (BrainCore.prototype.getTask as jest.Mock).mockResolvedValue(null);

      const status = await cortex.getTaskStatus(999);

      expect(status.task).toBeNull();
      expect(status.steps).toEqual([]);
    });
  });

  describe('searchMemory', () => {
    it('should search memory', async () => {
      await cortex.searchMemory(1, 'test query');

      expect(MemoryCore.prototype.retrieve).toHaveBeenCalledWith(1, 'test query', undefined);
    });

    it('should search with options', async () => {
      await cortex.searchMemory(1, 'test query', {
        shortTermCount: 10,
        type: 'skill',
      });

      expect(MemoryCore.prototype.retrieve).toHaveBeenCalledWith(1, 'test query', {
        shortTermCount: 10,
        type: 'skill',
      });
    });
  });

  describe('storeSkill', () => {
    it('should store skill in long-term memory', async () => {
      const memoryId = await cortex.storeSkill(1, 'Python', 'Programming language');

      expect(memoryId).toBe(1);
      expect(MemoryCore.prototype.storeLongTerm).toHaveBeenCalledWith(
        1,
        expect.stringContaining('Python'),
        'skill',
        undefined,
        { skillName: 'Python' }
      );
    });
  });

  describe('getSystemStatus', () => {
    it('should return system status', async () => {
      const status = await cortex.getSystemStatus();

      expect(status).toHaveProperty('queue');
      expect(status).toHaveProperty('tasks');
      expect(status).toHaveProperty('tools');
      expect(status).toHaveProperty('timestamp');
    });
  });
});

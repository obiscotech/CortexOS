import { BrainCore } from '../core/brain';
import { TaskRepository } from '../db/taskRepository';

jest.mock('../db/taskRepository');
jest.mock('../db/stepRepository');
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
jest.mock('../core/llm');

describe('BrainCore', () => {
  let brain: BrainCore;

  beforeEach(() => {
    brain = new BrainCore();
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task with goal', async () => {
      const mockTask = {
        id: 1,
        goal: 'Test goal',
        status: 'pending' as const,
        parent_task_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (TaskRepository.prototype.create as jest.Mock).mockResolvedValue(mockTask);

      const result = await brain.createTask('Test goal');

      expect(result).toEqual(mockTask);
      expect(TaskRepository.prototype.create).toHaveBeenCalledWith('Test goal', undefined, 1);
    });
  });

  describe('getTask', () => {
    it('should retrieve task by id', async () => {
      const mockTask = {
        id: 1,
        goal: 'Test goal',
        status: 'pending' as const,
        parent_task_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (TaskRepository.prototype.findById as jest.Mock).mockResolvedValue(mockTask);

      const result = await brain.getTask(1);

      expect(result).toEqual(mockTask);
    });

    it('should return null for non-existent task', async () => {
      (TaskRepository.prototype.findById as jest.Mock).mockResolvedValue(null);

      const result = await brain.getTask(999);

      expect(result).toBeNull();
    });
  });
});

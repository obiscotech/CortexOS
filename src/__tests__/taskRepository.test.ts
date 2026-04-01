import { TaskRepository } from '../db/taskRepository';
import { pool } from '../db/pool';

jest.mock('../db/pool', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('TaskRepository', () => {
  let repo: TaskRepository;

  beforeEach(() => {
    repo = new TaskRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const mockTask = {
        id: 1,
        goal: 'Test task',
        status: 'pending',
        parent_task_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockTask] });

      const result = await repo.create('Test task');

      expect(result).toEqual(mockTask);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO tasks (goal, parent_task_id, created_by) VALUES ($1, $2, $3) RETURNING *',
        ['Test task', null, null]
      );
    });
  });

  describe('findById', () => {
    it('should find task by id', async () => {
      const mockTask = {
        id: 1,
        goal: 'Test task',
        status: 'pending',
        parent_task_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockTask] });

      const result = await repo.findById(1);

      expect(result).toEqual(mockTask);
    });

    it('should return null if task not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repo.findById(999);

      expect(result).toBeNull();
    });
  });
});

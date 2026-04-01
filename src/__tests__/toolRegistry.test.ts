import { ToolRegistry } from '../tools/registry';

jest.mock('../db/logRepository');

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe('listTools', () => {
    it('should list all registered tools', () => {
      const tools = registry.listTools();
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some(t => t.name === 'browser')).toBe(true);
      expect(tools.some(t => t.name === 'terminal')).toBe(true);
      expect(tools.some(t => t.name === 'file')).toBe(true);
    });
  });

  describe('getTool', () => {
    it('should get tool by name', () => {
      const tool = registry.getTool('browser');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('browser');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = registry.getTool('nonexistent');
      expect(tool).toBeUndefined();
    });
  });

  describe('execute', () => {
    it('should reject execution without permission', async () => {
      const result = await registry.execute(
        'terminal',
        { command: 'ls' },
        { taskId: 1, userId: 1, permissions: {} }
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('should allow execution with master permission', async () => {
      const result = await registry.execute(
        'terminal',
        { command: 'echo test' },
        { taskId: 1, userId: 1, permissions: { all: true } }
      );
      expect(result.success).toBe(true);
    });
  });
});

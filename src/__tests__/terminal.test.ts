import { TerminalTool } from '../tools/terminal';

describe('TerminalTool', () => {
  let tool: TerminalTool;

  beforeEach(() => {
    tool = new TerminalTool();
  });

  describe('validate', () => {
    it('should validate command parameter', () => {
      expect(tool.validate({ command: 'ls -la' })).toBe(true);
    });

    it('should reject empty command', () => {
      expect(tool.validate({ command: '' })).toBe(false);
    });

    it('should reject missing command', () => {
      expect(tool.validate({})).toBe(false);
    });
  });

  describe('execute', () => {
    it('should execute safe command', async () => {
      const result = await tool.execute({ command: 'echo "test"' });
      expect(result.success).toBe(true);
      expect(result.output).toContain('test');
    });

    it('should block dangerous commands', async () => {
      const result = await tool.execute({ command: 'rm -rf /' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('blocked');
    });

    it('should block sudo commands', async () => {
      const result = await tool.execute({ command: 'sudo ls' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('blocked');
    });
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(tool.name).toBe('terminal');
    });

    it('should have description', () => {
      expect(tool.description).toBeTruthy();
    });
  });
});

import { FileTool } from '../tools/file';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('FileTool', () => {
  let tool: FileTool;
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'cortex-test-'));
    tool = new FileTool(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('validate', () => {
    it('should validate read action', () => {
      expect(tool.validate({ action: 'read', path: 'test.txt' })).toBe(true);
    });

    it('should validate write action', () => {
      expect(tool.validate({ action: 'write', path: 'test.txt', content: 'hello' })).toBe(true);
    });

    it('should reject invalid action', () => {
      expect(tool.validate({ action: 'invalid' })).toBe(false);
    });

    it('should reject missing parameters', () => {
      expect(tool.validate({ action: 'write', path: 'test.txt' })).toBe(false);
    });
  });

  describe('execute', () => {
    it('should write and read file', async () => {
      const writeResult = await tool.execute({
        action: 'write',
        path: 'test.txt',
        content: 'Hello World',
      });
      expect(writeResult.success).toBe(true);

      const readResult = await tool.execute({
        action: 'read',
        path: 'test.txt',
      });
      expect(readResult.success).toBe(true);
      expect(readResult.output).toBe('Hello World');
    });

    it('should create directory', async () => {
      const result = await tool.execute({
        action: 'mkdir',
        path: 'subdir',
      });
      expect(result.success).toBe(true);
    });

    it('should list directory', async () => {
      await tool.execute({ action: 'write', path: 'file1.txt', content: 'test' });
      await tool.execute({ action: 'write', path: 'file2.txt', content: 'test' });

      const result = await tool.execute({
        action: 'list',
        path: '.',
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('file1.txt');
      expect(result.output).toContain('file2.txt');
    });
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(tool.name).toBe('file');
    });

    it('should have description', () => {
      expect(tool.description).toBeTruthy();
    });
  });
});

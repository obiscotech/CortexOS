import { BrowserTool } from '../tools/browser';

describe('BrowserTool', () => {
  let tool: BrowserTool;

  beforeEach(() => {
    tool = new BrowserTool();
  });

  describe('validate', () => {
    it('should validate navigate action', () => {
      expect(tool.validate({ action: 'navigate', url: 'https://example.com' })).toBe(true);
    });

    it('should validate click action', () => {
      expect(tool.validate({ action: 'click', selector: '#button' })).toBe(true);
    });

    it('should validate type action', () => {
      expect(tool.validate({ action: 'type', selector: '#input', text: 'hello' })).toBe(true);
    });

    it('should reject invalid action', () => {
      expect(tool.validate({ action: 'invalid' })).toBe(false);
    });

    it('should reject missing parameters', () => {
      expect(tool.validate({ action: 'navigate' })).toBe(false);
    });
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(tool.name).toBe('browser');
    });

    it('should have description', () => {
      expect(tool.description).toBeTruthy();
    });
  });
});

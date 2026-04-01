import { ConnectorManager } from '../connectors/manager';
import { ZapierConnector } from '../connectors/automation/zapier';
import { GenericWebhook } from '../connectors/webhook/generic';

describe('ConnectorManager', () => {
  let manager: ConnectorManager;

  beforeEach(() => {
    manager = new ConnectorManager({
      zapier: {
        enabled: true,
        credentials: { webhookUrl: 'https://hooks.zapier.com/test' },
      },
      slack: {
        enabled: true,
        credentials: { botToken: 'xoxb-test-token' },
      },
      webhook: {
        config: { enabled: true, credentials: {} },
        webhooks: {
          test: {
            url: 'https://example.com/webhook',
            method: 'POST',
          },
        },
      },
    });
  });

  test('should initialize enabled connectors', async () => {
    await manager.initialize();
    const connectors = manager.listConnectors();
    
    expect(connectors).toContain('zapier');
    expect(connectors).toContain('slack');
    expect(connectors).toContain('webhook');
  });

  test('should get connector by name', async () => {
    await manager.initialize();
    const zapier = manager.getConnector('zapier');
    
    expect(zapier).toBeInstanceOf(ZapierConnector);
    expect(zapier?.getName()).toBe('Zapier');
  });

  test('should execute connector action', async () => {
    await manager.initialize();
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const result = await manager.execute('zapier', 'trigger', { data: 'test' });
    
    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalled();
  });

  test('should throw error for non-existent connector', async () => {
    await manager.initialize();
    
    await expect(
      manager.execute('nonexistent', 'action', {})
    ).rejects.toThrow('Connector nonexistent not found or not enabled');
  });

  test('should perform health check on all connectors', async () => {
    await manager.initialize();
    const health = await manager.healthCheck();
    
    expect(health).toHaveProperty('zapier');
    expect(health).toHaveProperty('slack');
    expect(health).toHaveProperty('webhook');
  });

  test('should perform health check on specific connector', async () => {
    await manager.initialize();
    const health = await manager.healthCheck('zapier');
    
    expect(health).toHaveProperty('zapier');
    expect(Object.keys(health)).toHaveLength(1);
  });
});

describe('GenericWebhook', () => {
  let webhook: GenericWebhook;

  beforeEach(() => {
    webhook = new GenericWebhook(
      { enabled: true, credentials: {} },
      {
        test: {
          url: 'https://example.com/webhook',
          method: 'POST',
        },
        auth_test: {
          url: 'https://example.com/auth',
          auth: {
            type: 'bearer',
            token: 'test-token',
          },
        },
      }
    );
  });

  test('should execute webhook with payload', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ received: true }),
    });

    const result = await webhook.execute('trigger', {
      webhook: 'test',
      payload: { data: 'test' },
    });

    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  test('should add bearer auth header', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await webhook.execute('trigger', {
      webhook: 'auth_test',
      payload: {},
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/auth',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      })
    );
  });

  test('should add and remove webhooks dynamically', () => {
    webhook.addWebhook('new', { url: 'https://new.com' });
    expect(webhook.listWebhooks()).toContain('new');

    webhook.removeWebhook('new');
    expect(webhook.listWebhooks()).not.toContain('new');
  });

  test('should list all webhooks', () => {
    const webhooks = webhook.listWebhooks();
    expect(webhooks).toContain('test');
    expect(webhooks).toContain('auth_test');
  });
});

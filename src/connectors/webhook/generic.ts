import { BaseConnector, ConnectorConfig, ConnectorResult } from '../base';

interface WebhookConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    headerName?: string;
  };
}

export class GenericWebhook extends BaseConnector {
  private webhooks: Map<string, WebhookConfig> = new Map();

  constructor(config: ConnectorConfig, webhooks: Record<string, WebhookConfig>) {
    super('Webhook', config);
    this.webhooks = new Map(Object.entries(webhooks));
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) return;
  }

  async execute(_action: string, params: Record<string, any>): Promise<ConnectorResult> {
    const { webhook, payload } = params;
    const config = this.webhooks.get(webhook);

    if (!config) {
      return { success: false, error: `Webhook ${webhook} not found` };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      };

      if (config.auth) {
        switch (config.auth.type) {
          case 'bearer':
            headers['Authorization'] = `Bearer ${config.auth.token}`;
            break;
          case 'basic':
            const credentials = Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
            break;
          case 'apikey':
            headers[config.auth.headerName || 'X-API-Key'] = config.auth.token || '';
            break;
        }
      }

      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.webhooks.size > 0;
  }

  addWebhook(name: string, config: WebhookConfig): void {
    this.webhooks.set(name, config);
  }

  removeWebhook(name: string): void {
    this.webhooks.delete(name);
  }

  listWebhooks(): string[] {
    return Array.from(this.webhooks.keys());
  }
}

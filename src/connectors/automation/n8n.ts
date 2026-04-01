import { BaseConnector, ConnectorConfig, ConnectorResult } from '../base';

export class N8nConnector extends BaseConnector {
  private webhookUrl: string;

  constructor(config: ConnectorConfig) {
    super('n8n', config);
    this.webhookUrl = config.credentials.webhookUrl || '';
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled || !this.webhookUrl) {
      throw new Error('n8n webhook URL not configured');
    }
  }

  async execute(action: string, params: Record<string, any>): Promise<ConnectorResult> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async healthCheck(): Promise<boolean> {
    return !!this.webhookUrl;
  }
}

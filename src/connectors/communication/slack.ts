import { BaseConnector, ConnectorConfig, ConnectorResult } from '../base';

export class SlackConnector extends BaseConnector {
  private botToken: string;
  private apiUrl = 'https://slack.com/api';

  constructor(config: ConnectorConfig) {
    super('Slack', config);
    this.botToken = config.credentials.botToken || '';
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled || !this.botToken) {
      throw new Error('Slack bot token not configured');
    }
  }

  async execute(action: string, params: Record<string, any>): Promise<ConnectorResult> {
    switch (action) {
      case 'send_message':
        return this.sendMessage(params.channel, params.text, params.blocks);
      case 'upload_file':
        return this.uploadFile(params.channels, params.file, params.title);
      case 'list_channels':
        return this.listChannels();
      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  }

  private async sendMessage(channel: string, text: string, blocks?: any[]): Promise<ConnectorResult> {
    try {
      const response = await fetch(`${this.apiUrl}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel, text, blocks }),
      });

      const data: any = await response.json();
      return { success: data.ok, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async uploadFile(channels: string, file: string, title?: string): Promise<ConnectorResult> {
    try {
      const response = await fetch(`${this.apiUrl}/files.upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channels, content: file, title }),
      });

      const data: any = await response.json();
      return { success: data.ok, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async listChannels(): Promise<ConnectorResult> {
    try {
      const response = await fetch(`${this.apiUrl}/conversations.list`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.botToken}` },
      });

      const data: any = await response.json();
      return { success: data.ok, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/auth.test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.botToken}` },
      });
      const data: any = await response.json();
      return data.ok;
    } catch {
      return false;
    }
  }
}

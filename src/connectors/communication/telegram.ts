import { BaseConnector, ConnectorConfig, ConnectorResult } from '../base';

export class TelegramConnector extends BaseConnector {
  private apiUrl: string;
  private botToken: string;

  constructor(config: ConnectorConfig) {
    super('Telegram', config);
    this.botToken = config.credentials.botToken || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled || !this.botToken) {
      throw new Error('Telegram bot token not configured');
    }
  }

  async execute(action: string, params: Record<string, any>): Promise<ConnectorResult> {
    switch (action) {
      case 'send_message':
        return this.sendMessage(params.chatId, params.text, params.parseMode);
      case 'send_photo':
        return this.sendPhoto(params.chatId, params.photo, params.caption);
      case 'get_updates':
        return this.getUpdates(params.offset);
      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  }

  private async sendMessage(chatId: string, text: string, parseMode?: string): Promise<ConnectorResult> {
    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
      });

      const data: any = await response.json();
      return { success: data.ok, data: data.result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async sendPhoto(chatId: string, photo: string, caption?: string): Promise<ConnectorResult> {
    try {
      const response = await fetch(`${this.apiUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo, caption }),
      });

      const data: any = await response.json();
      return { success: data.ok, data: data.result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async getUpdates(offset?: number): Promise<ConnectorResult> {
    try {
      const response = await fetch(`${this.apiUrl}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset }),
      });

      const data: any = await response.json();
      return { success: data.ok, data: data.result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`);
      const data: any = await response.json();
      return data.ok;
    } catch {
      return false;
    }
  }
}

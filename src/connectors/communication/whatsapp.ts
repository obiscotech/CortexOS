import { BaseConnector, ConnectorConfig, ConnectorResult } from '../base';

export class WhatsAppConnector extends BaseConnector {
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor(config: ConnectorConfig) {
    super('WhatsApp', config);
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.accessToken = config.credentials.accessToken || '';
    this.phoneNumberId = config.credentials.phoneNumberId || '';
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled || !this.accessToken || !this.phoneNumberId) {
      throw new Error('WhatsApp credentials not configured');
    }
  }

  async execute(action: string, params: Record<string, any>): Promise<ConnectorResult> {
    switch (action) {
      case 'send_message':
        return this.sendMessage(params.to, params.message);
      case 'send_template':
        return this.sendTemplate(params.to, params.template, params.components);
      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  }

  private async sendMessage(to: string, message: string): Promise<ConnectorResult> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async sendTemplate(to: string, template: string, components: any[]): Promise<ConnectorResult> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: { name: template, language: { code: 'en' }, components },
        }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async healthCheck(): Promise<boolean> {
    return !!(this.accessToken && this.phoneNumberId);
  }
}

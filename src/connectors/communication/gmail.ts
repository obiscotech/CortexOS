import { BaseConnector, ConnectorConfig, ConnectorResult } from '../base';
import { google } from 'googleapis';

export class GmailConnector extends BaseConnector {
  private gmail: any;

  constructor(config: ConnectorConfig) {
    super('Gmail', config);
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) return;

    const { clientId, clientSecret, refreshToken } = this.config.credentials;
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Gmail credentials not configured');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async execute(action: string, params: Record<string, any>): Promise<ConnectorResult> {
    switch (action) {
      case 'send_email':
        return this.sendEmail(params.to, params.subject, params.body);
      case 'list_messages':
        return this.listMessages(params.query, params.maxResults);
      case 'get_message':
        return this.getMessage(params.messageId);
      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  }

  private async sendEmail(to: string, subject: string, body: string): Promise<ConnectorResult> {
    try {
      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body,
      ].join('\n');

      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
      });

      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async listMessages(query?: string, maxResults = 10): Promise<ConnectorResult> {
    try {
      const result = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async getMessage(messageId: string): Promise<ConnectorResult> {
    try {
      const result = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
      });

      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.gmail.users.getProfile({ userId: 'me' });
      return true;
    } catch {
      return false;
    }
  }
}

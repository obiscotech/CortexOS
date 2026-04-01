import { BaseConnector, ConnectorConfig } from './base';
import { MCPClient } from './mcp/client';
import { ZapierConnector } from './automation/zapier';
import { MakeConnector } from './automation/make';
import { N8nConnector } from './automation/n8n';
import { WhatsAppConnector } from './communication/whatsapp';
import { GmailConnector } from './communication/gmail';
import { TelegramConnector } from './communication/telegram';
import { SlackConnector } from './communication/slack';
import { GenericWebhook } from './webhook/generic';

interface ConnectorManagerConfig {
  mcp?: { config: ConnectorConfig; servers: Record<string, any> };
  zapier?: ConnectorConfig;
  make?: ConnectorConfig;
  n8n?: ConnectorConfig;
  whatsapp?: ConnectorConfig;
  gmail?: ConnectorConfig;
  telegram?: ConnectorConfig;
  slack?: ConnectorConfig;
  webhook?: { config: ConnectorConfig; webhooks: Record<string, any> };
}

export class ConnectorManager {
  private connectors: Map<string, BaseConnector> = new Map();

  constructor(private config: ConnectorManagerConfig) {}

  async initialize(): Promise<void> {
    if (this.config.mcp?.config.enabled) {
      const mcp = new MCPClient(this.config.mcp.config, this.config.mcp.servers);
      await mcp.initialize();
      this.connectors.set('mcp', mcp);
    }

    if (this.config.zapier?.enabled) {
      const zapier = new ZapierConnector(this.config.zapier);
      await zapier.initialize();
      this.connectors.set('zapier', zapier);
    }

    if (this.config.make?.enabled) {
      const make = new MakeConnector(this.config.make);
      await make.initialize();
      this.connectors.set('make', make);
    }

    if (this.config.n8n?.enabled) {
      const n8n = new N8nConnector(this.config.n8n);
      await n8n.initialize();
      this.connectors.set('n8n', n8n);
    }

    if (this.config.whatsapp?.enabled) {
      const whatsapp = new WhatsAppConnector(this.config.whatsapp);
      await whatsapp.initialize();
      this.connectors.set('whatsapp', whatsapp);
    }

    if (this.config.gmail?.enabled) {
      const gmail = new GmailConnector(this.config.gmail);
      await gmail.initialize();
      this.connectors.set('gmail', gmail);
    }

    if (this.config.telegram?.enabled) {
      const telegram = new TelegramConnector(this.config.telegram);
      await telegram.initialize();
      this.connectors.set('telegram', telegram);
    }

    if (this.config.slack?.enabled) {
      const slack = new SlackConnector(this.config.slack);
      await slack.initialize();
      this.connectors.set('slack', slack);
    }

    if (this.config.webhook?.config.enabled) {
      const webhook = new GenericWebhook(this.config.webhook.config, this.config.webhook.webhooks);
      await webhook.initialize();
      this.connectors.set('webhook', webhook);
    }
  }

  async execute(connector: string, action: string, params: Record<string, any>) {
    const conn = this.connectors.get(connector);
    if (!conn) {
      throw new Error(`Connector ${connector} not found or not enabled`);
    }

    return conn.execute(action, params);
  }

  async healthCheck(connector?: string): Promise<Record<string, boolean>> {
    if (connector) {
      const conn = this.connectors.get(connector);
      return { [connector]: conn ? await conn.healthCheck() : false };
    }

    const results: Record<string, boolean> = {};
    for (const [name, conn] of this.connectors.entries()) {
      results[name] = await conn.healthCheck();
    }
    return results;
  }

  getConnector(name: string): BaseConnector | undefined {
    return this.connectors.get(name);
  }

  listConnectors(): string[] {
    return Array.from(this.connectors.keys());
  }

  async shutdown(): Promise<void> {
    const mcp = this.connectors.get('mcp') as MCPClient;
    if (mcp) {
      await mcp.shutdown();
    }
  }
}

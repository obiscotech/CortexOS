export interface ConnectorConfig {
  enabled: boolean;
  credentials: Record<string, string>;
}

export interface ConnectorResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface WebhookConfig {
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

export interface ConnectorManagerConfig {
  mcp?: {
    config: ConnectorConfig;
    servers: Record<string, MCPServerConfig>;
  };
  zapier?: ConnectorConfig;
  make?: ConnectorConfig;
  n8n?: ConnectorConfig;
  whatsapp?: ConnectorConfig;
  gmail?: ConnectorConfig;
  telegram?: ConnectorConfig;
  slack?: ConnectorConfig;
  webhook?: {
    config: ConnectorConfig;
    webhooks: Record<string, WebhookConfig>;
  };
}

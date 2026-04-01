export interface ConnectorConfig {
  enabled: boolean;
  credentials: Record<string, string>;
}

export interface ConnectorResult {
  success: boolean;
  data?: any;
  error?: string;
}

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected name: string;

  constructor(name: string, config: ConnectorConfig) {
    this.name = name;
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract execute(action: string, params: Record<string, any>): Promise<ConnectorResult>;
  abstract healthCheck(): Promise<boolean>;

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getName(): string {
    return this.name;
  }
}

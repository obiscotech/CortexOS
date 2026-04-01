import { BaseConnector, ConnectorConfig, ConnectorResult } from '../base';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

interface MCPServer {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export class MCPClient extends BaseConnector {
  private clients: Map<string, Client> = new Map();
  private servers: Map<string, MCPServer>;

  constructor(config: ConnectorConfig, servers: Record<string, MCPServer>) {
    super('MCP', config);
    this.servers = new Map(Object.entries(servers));
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) return;

    for (const [name, server] of this.servers.entries()) {
      try {
        const transport = new StdioClientTransport({
          command: server.command,
          args: server.args,
          env: server.env,
        });

        const client = new Client({
          name: `cortex-${name}`,
          version: '1.0.0',
        }, {
          capabilities: {},
        });

        await client.connect(transport);
        this.clients.set(name, client);
      } catch (error) {
        console.error(`Failed to connect to MCP server ${name}:`, error);
      }
    }
  }

  async execute(_action: string, params: Record<string, any>): Promise<ConnectorResult> {
    const { server, tool, arguments: toolArgs } = params;

    const client = this.clients.get(server);
    if (!client) {
      return { success: false, error: `MCP server ${server} not found` };
    }

    try {
      const result = await client.callTool({ name: tool, arguments: toolArgs });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.clients.size > 0;
  }

  async listTools(server: string): Promise<any[]> {
    const client = this.clients.get(server);
    if (!client) return [];

    try {
      const response = await client.listTools();
      return response.tools;
    } catch {
      return [];
    }
  }

  async shutdown(): Promise<void> {
    for (const client of this.clients.values()) {
      await client.close();
    }
    this.clients.clear();
  }
}

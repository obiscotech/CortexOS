import { FastifyInstance } from 'fastify';
import { ConnectorManager } from '../connectors/manager';

export async function connectorRoutes(fastify: FastifyInstance, connectorManager: ConnectorManager) {
  fastify.post('/connectors/execute', async (request, reply) => {
    const { connector, action, params } = request.body as any;

    try {
      const result = await connectorManager.execute(connector, action, params);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.get('/connectors/health', async (request, reply) => {
    const { connector } = request.query as any;

    try {
      const health = await connectorManager.healthCheck(connector);
      return reply.send({ health });
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.get('/connectors/list', async (_request, reply) => {
    const connectors = connectorManager.listConnectors();
    return reply.send({ connectors });
  });

  fastify.get('/connectors/mcp/tools', async (request, reply) => {
    const { server } = request.query as any;

    try {
      const mcp = connectorManager.getConnector('mcp') as any;
      if (!mcp) {
        return reply.status(404).send({ error: 'MCP connector not enabled' });
      }

      const tools = await mcp.listTools(server);
      return reply.send({ tools });
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.post('/connectors/webhook/add', async (request, reply) => {
    const { name, config } = request.body as any;

    try {
      const webhook = connectorManager.getConnector('webhook') as any;
      if (!webhook) {
        return reply.status(404).send({ error: 'Webhook connector not enabled' });
      }

      webhook.addWebhook(name, config);
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.delete('/connectors/webhook/:name', async (request, reply) => {
    const { name } = request.params as any;

    try {
      const webhook = connectorManager.getConnector('webhook') as any;
      if (!webhook) {
        return reply.status(404).send({ error: 'Webhook connector not enabled' });
      }

      webhook.removeWebhook(name);
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.get('/connectors/webhook/list', async (_request, reply) => {
    try {
      const webhook = connectorManager.getConnector('webhook') as any;
      if (!webhook) {
        return reply.status(404).send({ error: 'Webhook connector not enabled' });
      }

      const webhooks = webhook.listWebhooks();
      return reply.send({ webhooks });
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });
}

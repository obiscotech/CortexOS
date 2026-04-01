import { FastifyInstance } from 'fastify';
import { LearningCore } from '../learning/core';

export async function learningRoutes(fastify: FastifyInstance, learningCore: LearningCore) {
  fastify.post('/learning/task/:taskId', async (request, reply) => {
    const { taskId } = request.params as any;
    const { userId } = request.body as any;

    try {
      const result = await learningCore.learnFromTask(parseInt(taskId), userId);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.get('/learning/skills', async (request, reply) => {
    const { userId, goal } = request.query as any;

    try {
      const skills = await learningCore.findRelevantSkills(goal || '', parseInt(userId));
      return reply.send({ skills });
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.post('/learning/feedback', async (request, reply) => {
    const { taskId, rating, comment, userId } = request.body as any;

    try {
      await learningCore.recordFeedback(
        { taskId, rating, comment, timestamp: new Date() },
        userId
      );
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.get('/learning/performance', async (request, reply) => {
    const { userId } = request.query as any;

    try {
      const analysis = await learningCore.analyzePerformance(parseInt(userId));
      return reply.send(analysis);
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.post('/learning/adapt', async (request, reply) => {
    const { userId, context } = request.body as any;

    try {
      const strategy = await learningCore.adaptToContext(userId, context);
      return reply.send({ strategy });
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.post('/learning/preferences', async (request, reply) => {
    const { userId, preferences } = request.body as any;

    try {
      await learningCore.updateUserPreferences(userId, preferences);
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.get('/learning/profile', async (request, reply) => {
    const { userId } = request.query as any;

    try {
      const profile = learningCore.getBehaviorProfile(parseInt(userId));
      return reply.send({ profile });
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.get('/learning/report', async (request, reply) => {
    const { userId } = request.query as any;

    try {
      const report = await learningCore.generateLearningReport(parseInt(userId));
      return reply.send(report);
    } catch (error) {
      return reply.status(500).send({ error: (error as Error).message });
    }
  });
}

import { BrainCore } from '../core/brain';
import { MemoryCore } from '../memory/core';
import { SchedulerCore } from '../scheduler/core';
import { ToolRegistry } from '../tools/registry';
import { ConnectorManager } from '../connectors/manager';
import { LearningCore } from '../learning/core';
import { TaskRepository } from '../db/taskRepository';
import { LogRepository } from '../db/logRepository';
import { UserRepository } from '../db/userRepository';
import { Task, Step } from '../types/models';

export class CortexOS {
  private brain: BrainCore;
  private memory: MemoryCore;
  private scheduler: SchedulerCore;
  private toolRegistry: ToolRegistry;
  private connectorManager: ConnectorManager;
  private learningCore: LearningCore;
  private taskRepo: TaskRepository;
  private logRepo: LogRepository;
  private userRepo: UserRepository;

  constructor(connectorManager: ConnectorManager) {
    this.brain = new BrainCore();
    this.memory = new MemoryCore();
    this.scheduler = new SchedulerCore();
    this.toolRegistry = new ToolRegistry();
    this.connectorManager = connectorManager;
    this.learningCore = new LearningCore();
    this.taskRepo = new TaskRepository();
    this.logRepo = new LogRepository();
    this.userRepo = new UserRepository();
  }

  async executeTask(
    goal: string,
    userId: number,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      useMemory?: boolean;
      storeMemory?: boolean;
      parentTaskId?: number;
    }
  ): Promise<{ task: Task; steps: Step[] }> {
    const { priority = 'normal', useMemory = true, storeMemory = true, parentTaskId } = options || {};

    await this.logRepo.create('Task execution started', goal, undefined, userId, 'info');

    // Retrieve relevant memories if enabled
    if (useMemory) {
      const memories = await this.memory.retrieve(userId, goal, {
        shortTermCount: 3,
        longTermCount: 5,
      });

      if (memories.shortTerm.length > 0 || memories.longTerm.length > 0) {
        this.buildMemoryContext(memories);
        await this.logRepo.create(
          'Retrieved memories',
          `${memories.shortTerm.length} short-term, ${memories.longTerm.length} long-term`,
          undefined,
          userId,
          'info'
        );
      }
    }

    // Create task with context
    const task = await this.brain.createTask(goal, parentTaskId, userId);

    // Schedule task execution
    const jobId = await this.scheduler.scheduleTask(task.id, userId, { priority });

    await this.logRepo.create(
      'Task scheduled',
      `Job ID: ${jobId}`,
      task.id,
      userId,
      'info'
    );

    // Process task
    await this.brain.processTask(task.id, userId);

    // Store execution in memory if enabled
    if (storeMemory) {
      await this.memory.storeShortTerm(
        userId,
        `Completed task: ${goal}`,
        { taskId: task.id, timestamp: Date.now() }
      );
    }

    const steps = await this.brain.getTaskSteps(task.id);

    await this.logRepo.create('Task execution completed', null, task.id, userId, 'info');

    // Learn from completed task
    if (task.status === 'completed') {
      await this.learningCore.learnFromTask(task.id, userId);
    }

    return { task, steps };
  }

  async executeDelayedTask(
    goal: string,
    userId: number,
    delayMs: number,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      useMemory?: boolean;
    }
  ): Promise<{ taskId: number; jobId: string }> {
    const task = await this.brain.createTask(goal, undefined, userId);

    const jobId = await this.scheduler.scheduleDelayedTask(
      task.id,
      userId,
      delayMs,
      { priority: options?.priority }
    );

    await this.logRepo.create(
      'Delayed task scheduled',
      `Delay: ${delayMs}ms, Job ID: ${jobId}`,
      task.id,
      userId,
      'info'
    );

    return { taskId: task.id, jobId };
  }

  async executeRecurringTask(
    name: string,
    goal: string,
    userId: number,
    cronExpression: string,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      storeMemory?: boolean;
    }
  ): Promise<{ jobId: string; scheduleId: number }> {
    const result = await this.scheduler.scheduleRecurringTask(
      name,
      goal,
      userId,
      cronExpression,
      { priority: options?.priority }
    );

    await this.logRepo.create(
      'Recurring task scheduled',
      `Cron: ${cronExpression}, Job ID: ${result.jobId}`,
      undefined,
      userId,
      'info'
    );

    return result;
  }

  async getTaskStatus(taskId: number): Promise<{
    task: Task | null;
    steps: Step[];
    logs: unknown[];
  }> {
    const task = await this.brain.getTask(taskId);
    if (!task) {
      return { task: null, steps: [], logs: [] };
    }

    const steps = await this.brain.getTaskSteps(taskId);
    const logs = await this.logRepo.findByTaskId(taskId);

    return { task, steps, logs };
  }

  async searchMemory(
    userId: number,
    query: string,
    options?: {
      shortTermCount?: number;
      longTermCount?: number;
      type?: 'short_term' | 'long_term' | 'skill' | 'context';
    }
  ) {
    return this.memory.retrieve(userId, query, options);
  }

  async storeSkill(
    userId: number,
    skillName: string,
    skillDescription: string,
    taskId?: number
  ): Promise<number> {
    const content = `Skill: ${skillName}\nDescription: ${skillDescription}`;
    
    const memoryId = await this.memory.storeLongTerm(
      userId,
      content,
      'skill',
      taskId,
      { skillName }
    );

    await this.logRepo.create(
      'Skill stored',
      skillName,
      taskId,
      userId,
      'info'
    );

    return memoryId;
  }

  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
    userId: number,
    taskId?: number
  ) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.toolRegistry.execute(toolName, params, {
      taskId: taskId || 0,
      userId,
      permissions: user.permissions,
    });
  }

  async getSystemStatus() {
    const queueStats = await this.scheduler.getQueueStats();
    const taskStats = {
      pending: (await this.taskRepo.findByStatus('pending')).length,
      executing: (await this.taskRepo.findByStatus('executing')).length,
      completed: (await this.taskRepo.findByStatus('completed')).length,
      failed: (await this.taskRepo.findByStatus('failed')).length,
    };

    const tools = this.toolRegistry.listTools();

    return {
      queue: queueStats,
      tasks: taskStats,
      tools: tools.length,
      timestamp: new Date().toISOString(),
    };
  }

  private buildMemoryContext(memories: {
    shortTerm: Array<{ content: string }>;
    longTerm: Array<{ content: string }>;
  }): string {
    let context = '';

    if (memories.shortTerm.length > 0) {
      context += 'Recent context:\n';
      memories.shortTerm.forEach(m => {
        context += `- ${m.content}\n`;
      });
    }

    if (memories.longTerm.length > 0) {
      context += '\nRelevant knowledge:\n';
      memories.longTerm.forEach(m => {
        context += `- ${m.content}\n`;
      });
    }

    return context;
  }

  async executeConnector(
    connector: string,
    action: string,
    params: Record<string, any>,
    userId: number,
    taskId?: number
  ) {
    await this.logRepo.create(
      `Connector execution: ${connector}.${action}`,
      JSON.stringify(params),
      taskId,
      userId,
      'info'
    );

    const result = await this.connectorManager.execute(connector, action, params);

    if (result.success) {
      await this.memory.storeShortTerm(
        userId,
        `Executed ${connector}.${action}`,
        { result: result.data, timestamp: Date.now() }
      );
    }

    return result;
  }

  getConnectorManager(): ConnectorManager {
    return this.connectorManager;
  }

  getLearningCore(): LearningCore {
    return this.learningCore;
  }

  async shutdown(): Promise<void> {
    await this.connectorManager.shutdown();
    await this.scheduler.close();
    await this.logRepo.create('System shutdown', null, undefined, undefined, 'info');
  }
}

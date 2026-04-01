import { TaskRepository } from '../db/taskRepository';
import { StepRepository } from '../db/stepRepository';
import { LogRepository } from '../db/logRepository';
import { UserRepository } from '../db/userRepository';
import { generatePlan } from './llm';
import { Task, Step } from '../types/models';
import { ToolRegistry } from '../tools/registry';

export class BrainCore {
  private taskRepo: TaskRepository;
  private stepRepo: StepRepository;
  private logRepo: LogRepository;
  private userRepo: UserRepository;
  private toolRegistry: ToolRegistry;

  constructor() {
    this.taskRepo = new TaskRepository();
    this.stepRepo = new StepRepository();
    this.logRepo = new LogRepository();
    this.userRepo = new UserRepository();
    this.toolRegistry = new ToolRegistry();
  }

  async processTask(taskId: number, userId: number = 1): Promise<void> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) throw new Error('Task not found');

    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error('User not found');

    await this.logRepo.create('Task processing started', null, taskId, userId);

    try {
      // Planning phase
      await this.taskRepo.updateStatus(taskId, 'planning');
      const plan = await generatePlan(task.goal);
      
      // Create steps
      for (const step of plan) {
        await this.stepRepo.create(taskId, step.action);
      }

      await this.logRepo.create('Plan generated', JSON.stringify(plan), taskId, userId);

      // Execution phase
      await this.taskRepo.updateStatus(taskId, 'executing');
      const steps = await this.stepRepo.findByTaskId(taskId);

      for (const step of steps) {
        await this.executeStep(step, taskId, userId, user.permissions);
      }

      await this.taskRepo.updateStatus(taskId, 'completed');
      await this.logRepo.create('Task completed', null, taskId, userId);
    } catch (error) {
      await this.taskRepo.updateStatus(taskId, 'failed');
      await this.logRepo.create(
        'Task failed',
        error instanceof Error ? error.message : 'Unknown error',
        taskId,
        userId,
        'error'
      );
      throw error;
    }
  }

  private async executeStep(
    step: Step,
    taskId: number,
    userId: number,
    permissions: Record<string, unknown>
  ): Promise<void> {
    await this.stepRepo.updateStatus(step.id, 'executing');
    await this.logRepo.create(`Executing step: ${step.action}`, null, taskId, userId);

    try {
      // Parse step action to extract tool and parameters
      const { toolName, params } = this.parseStepAction(step.action);

      if (toolName) {
        // Execute using tool
        const result = await this.toolRegistry.execute(toolName, params, {
          taskId,
          userId,
          permissions,
        });

        if (result.success) {
          await this.stepRepo.updateStatus(step.id, 'completed', result.output);
          await this.logRepo.create(`Step completed: ${step.action}`, result.output, taskId, userId);
        } else {
          await this.stepRepo.updateStatus(step.id, 'failed', result.error);
          await this.logRepo.create(
            `Step failed: ${step.action}`,
            result.error || 'Unknown error',
            taskId,
            userId,
            'error'
          );
        }
      } else {
        // No tool specified, mark as completed
        const result = `Step executed: ${step.action}`;
        await this.stepRepo.updateStatus(step.id, 'completed', result);
        await this.logRepo.create(`Step completed: ${step.action}`, result, taskId, userId);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await this.stepRepo.updateStatus(step.id, 'failed', errorMsg);
      await this.logRepo.create(`Step failed: ${step.action}`, errorMsg, taskId, userId, 'error');
    }
  }

  private parseStepAction(action: string): { toolName: string | null; params: Record<string, unknown> } {
    // Simple parser for tool actions
    // Format: "tool:action param1=value1 param2=value2"
    // Example: "browser:navigate url=https://example.com"
    
    const match = action.match(/^(\w+):(\w+)\s*(.*)$/);
    if (!match) {
      return { toolName: null, params: {} };
    }

    const [, toolName, actionType, paramsStr] = match;
    const params: Record<string, unknown> = { action: actionType };

    // Parse parameters
    const paramMatches = paramsStr.matchAll(/(\w+)=([^\s]+)/g);
    for (const [, key, value] of paramMatches) {
      params[key] = value;
    }

    return { toolName, params };
  }

  async createTask(goal: string, parentTaskId?: number, userId: number = 1): Promise<Task> {
    const task = await this.taskRepo.create(goal, parentTaskId, userId);
    await this.logRepo.create('Task created', goal, task.id, userId);
    return task;
  }

  async getTask(taskId: number): Promise<Task | null> {
    return this.taskRepo.findById(taskId);
  }

  async getTaskSteps(taskId: number): Promise<Step[]> {
    return this.stepRepo.findByTaskId(taskId);
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }
}

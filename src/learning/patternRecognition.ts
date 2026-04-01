import { TaskRepository } from '../db/taskRepository';
import { StepRepository } from '../db/stepRepository';
import { llmManager } from '../llm/manager';

export interface Pattern {
  id: string;
  name: string;
  frequency: number;
  tasks: number[];
  commonSteps: string[];
  confidence: number;
}

export class PatternRecognition {
  private taskRepo: TaskRepository;
  private stepRepo: StepRepository;

  constructor() {
    this.taskRepo = new TaskRepository();
    this.stepRepo = new StepRepository();
  }

  async analyzeUserPatterns(userId: number, limit = 50): Promise<Pattern[]> {
    const tasks = await this.taskRepo.findByUserId(userId, limit);
    const completedTasks = tasks.filter(t => t.status === 'completed');

    if (completedTasks.length < 3) return [];

    const taskAnalysis = await Promise.all(
      completedTasks.map(async (task) => {
        const steps = await this.stepRepo.findByTaskId(task.id);
        return {
          taskId: task.id,
          goal: task.goal,
          steps: steps.map(s => s.action),
        };
      })
    );

    const prompt = `Analyze these completed tasks and identify recurring patterns.

Tasks:
${taskAnalysis.map((t, i) => `${i + 1}. ${t.goal}\n   Steps: ${t.steps.join(' → ')}`).join('\n\n')}

Identify patterns where similar sequences of actions appear across multiple tasks.
Return JSON array: [{ name, frequency, taskIds, commonSteps, confidence }]`;

    try {
      const response = await llmManager.generate([{ role: 'user', content: prompt }]);
      const patterns = this.parsePatterns(response.content, taskAnalysis);
      return patterns;
    } catch {
      return [];
    }
  }

  private parsePatterns(content: string, _taskAnalysis: any[]): Pattern[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((p: any, idx: number) => ({
        id: `pattern-${idx}`,
        name: p.name || 'Unnamed Pattern',
        frequency: p.frequency || 1,
        tasks: p.taskIds || [],
        commonSteps: p.commonSteps || [],
        confidence: p.confidence || 0.5,
      }));
    } catch {
      return [];
    }
  }

  async detectAnomalies(userId: number): Promise<{ taskId: number; reason: string }[]> {
    const tasks = await this.taskRepo.findByUserId(userId, 20);
    const failedTasks = tasks.filter(t => t.status === 'failed');

    return failedTasks.map(t => ({
      taskId: t.id,
      reason: 'Task execution failed',
    }));
  }
}

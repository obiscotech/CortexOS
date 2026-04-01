import { TaskRepository } from '../db/taskRepository';
import { LogRepository } from '../db/logRepository';
import { MemoryCore } from '../memory/core';
import { llmManager } from '../llm/manager';

export interface Feedback {
  taskId: number;
  rating: number;
  comment?: string;
  timestamp: Date;
}

export interface Improvement {
  area: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
  impact: string;
}

export class FeedbackLoop {
  private taskRepo: TaskRepository;
  private logRepo: LogRepository;
  private memory: MemoryCore;

  constructor() {
    this.taskRepo = new TaskRepository();
    this.logRepo = new LogRepository();
    this.memory = new MemoryCore();
  }

  async recordFeedback(feedback: Feedback, userId: number): Promise<void> {
    await this.logRepo.create(
      'User feedback',
      JSON.stringify({ rating: feedback.rating, comment: feedback.comment }),
      feedback.taskId,
      userId,
      'info'
    );

    await this.memory.storeShortTerm(
      userId,
      `Feedback on task ${feedback.taskId}: Rating ${feedback.rating}/5. ${feedback.comment || ''}`,
      { type: 'feedback', taskId: feedback.taskId, rating: feedback.rating }
    );
  }

  async analyzeFeedback(userId: number): Promise<Improvement[]> {
    const memories = await this.memory.retrieve(userId, 'feedback', {
      shortTermCount: 20,
      type: 'context',
    });

    if (memories.shortTerm.length === 0) return [];

    const feedbackData = memories.shortTerm
      .filter((m: any) => m.metadata?.type === 'feedback')
      .map((m: any) => ({
        taskId: m.metadata?.taskId,
        rating: m.metadata?.rating,
        content: m.content,
      }));

    const prompt = `Analyze user feedback and suggest improvements.

Feedback:
${feedbackData.map((f, i) => `${i + 1}. Task ${f.taskId}: ${f.rating}/5 - ${f.content}`).join('\n')}

Identify areas for improvement and suggest actionable changes.
Return JSON array: [{ area, suggestion, priority, impact }]`;

    try {
      const response = await llmManager.generate([{ role: 'user', content: prompt }]);
      return this.parseImprovements(response.content);
    } catch {
      return [];
    }
  }

  private parseImprovements(content: string): Improvement[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((i: any) => ({
        area: i.area || 'General',
        suggestion: i.suggestion || '',
        priority: i.priority || 'medium',
        impact: i.impact || 'Unknown',
      }));
    } catch {
      return [];
    }
  }

  async getPerformanceMetrics(userId: number): Promise<{
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    successRate: number;
    avgFeedbackRating: number;
  }> {
    const tasks = await this.taskRepo.findByUserId(userId, 100);
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;

    const feedbackMemories = await this.memory.retrieve(userId, 'feedback', {
      shortTermCount: 50,
    });

    const ratings = feedbackMemories.shortTerm
      .filter((m: any) => m.metadata?.rating)
      .map((m: any) => m.metadata.rating);

    const avgRating = ratings.length > 0
      ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
      : 0;

    return {
      totalTasks: tasks.length,
      completedTasks: completed,
      failedTasks: failed,
      successRate: tasks.length > 0 ? completed / tasks.length : 0,
      avgFeedbackRating: avgRating,
    };
  }
}

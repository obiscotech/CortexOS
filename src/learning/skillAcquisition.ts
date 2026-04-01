import { MemoryCore } from '../memory/core';
import { TaskRepository } from '../db/taskRepository';
import { StepRepository } from '../db/stepRepository';
import { llmManager } from '../llm/manager';

export interface Skill {
  id: number;
  name: string;
  description: string;
  category: string;
  successRate: number;
  usageCount: number;
  pattern: string;
  metadata: Record<string, any>;
}

export class SkillAcquisition {
  private memory: MemoryCore;
  private taskRepo: TaskRepository;
  private stepRepo: StepRepository;

  constructor() {
    this.memory = new MemoryCore();
    this.taskRepo = new TaskRepository();
    this.stepRepo = new StepRepository();
  }

  async extractSkillFromTask(taskId: number, userId: number): Promise<Skill | null> {
    const task = await this.taskRepo.findById(taskId);
    if (!task || task.status !== 'completed') return null;

    const steps = await this.stepRepo.findByTaskId(taskId);
    if (steps.length === 0) return null;

    const prompt = `Analyze this completed task and extract a reusable skill pattern.

Task: ${task.goal}
Steps executed:
${steps.map((s, i) => `${i + 1}. ${s.action} - ${s.status}`).join('\n')}

Extract:
1. Skill name (concise, action-oriented)
2. Description (what it does)
3. Category (e.g., automation, communication, data-processing)
4. Pattern (generalized steps that can be reused)

Return JSON: { name, description, category, pattern }`;

    const response = await llmManager.generateJSON([{ role: 'user', content: prompt }]);

    const skillData = JSON.parse(response.content);

    const memoryId = await this.memory.storeLongTerm(
      userId,
      `Skill: ${skillData.name}\n${skillData.description}\nPattern: ${skillData.pattern}`,
      'skill',
      taskId,
      { skillName: skillData.name, category: skillData.category }
    );

    return {
      id: memoryId,
      name: skillData.name,
      description: skillData.description,
      category: skillData.category,
      successRate: 1.0,
      usageCount: 1,
      pattern: skillData.pattern,
      metadata: { extractedFrom: taskId },
    };
  }

  async findRelevantSkills(goal: string, userId: number, limit = 5): Promise<Skill[]> {
    const memories = await this.memory.retrieve(userId, goal, {
      longTermCount: limit,
      type: 'skill',
    });

    return memories.longTerm.map((m: any) => ({
      id: m.id,
      name: m.metadata?.skillName || 'Unknown',
      description: m.content,
      category: m.metadata?.category || 'general',
      successRate: 1.0,
      usageCount: 1,
      pattern: m.content,
      metadata: m.metadata || {},
    }));
  }

  async updateSkillMetrics(_skillId: number, _success: boolean): Promise<void> {
    // Skill metrics tracked in memory metadata
    // This is a placeholder for future enhancement
  }
}

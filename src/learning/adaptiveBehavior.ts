import { MemoryCore } from '../memory/core';
import { TaskRepository } from '../db/taskRepository';
import { llmManager } from '../llm/manager';

export interface Strategy {
  name: string;
  description: string;
  conditions: string[];
  actions: string[];
  successRate: number;
}

export interface BehaviorProfile {
  userId: number;
  preferences: Record<string, any>;
  strategies: Strategy[];
  adaptationLevel: number;
}

export class AdaptiveBehavior {
  private memory: MemoryCore;
  private taskRepo: TaskRepository;
  private profiles: Map<number, BehaviorProfile> = new Map();

  constructor() {
    this.memory = new MemoryCore();
    this.taskRepo = new TaskRepository();
  }

  async initializeProfile(userId: number): Promise<BehaviorProfile> {
    const profile: BehaviorProfile = {
      userId,
      preferences: {},
      strategies: [],
      adaptationLevel: 0,
    };

    this.profiles.set(userId, profile);
    return profile;
  }

  async adaptStrategy(userId: number, context: string): Promise<Strategy | null> {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = await this.initializeProfile(userId);
    }

    const tasks = await this.taskRepo.findByUserId(userId, 20);
    const recentPerformance = tasks.filter(t => t.status === 'completed').length / Math.max(tasks.length, 1);

    const memories = await this.memory.retrieve(userId, context, {
      shortTermCount: 5,
      longTermCount: 5,
    });

    const prompt = `Based on user's recent performance and context, suggest an adaptive strategy.

Context: ${context}
Recent Success Rate: ${(recentPerformance * 100).toFixed(1)}%
Recent Memories: ${memories.shortTerm.map((m: any) => m.content).join('; ')}

Suggest a strategy to improve task execution.
Return JSON: { name, description, conditions, actions, successRate }`;

    try {
      const response = await llmManager.generateJSON([{ role: 'user', content: prompt }]);

      const strategy = JSON.parse(response.content);
      profile.strategies.push(strategy);
      profile.adaptationLevel += 0.1;

      return strategy;
    } catch {
      return null;
    }
  }

  async updatePreferences(userId: number, preferences: Record<string, any>): Promise<void> {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = await this.initializeProfile(userId);
    }

    profile.preferences = { ...profile.preferences, ...preferences };
    this.profiles.set(userId, profile);

    await this.memory.storeShortTerm(
      userId,
      `Updated preferences: ${JSON.stringify(preferences)}`,
      { type: 'preference_update' }
    );
  }

  getProfile(userId: number): BehaviorProfile | undefined {
    return this.profiles.get(userId);
  }

  async shouldAdapt(userId: number): Promise<boolean> {
    const tasks = await this.taskRepo.findByUserId(userId, 10);
    const recentFailures = tasks.filter(t => t.status === 'failed').length;

    return recentFailures >= 3;
  }
}

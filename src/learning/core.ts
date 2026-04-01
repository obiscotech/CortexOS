import { SkillAcquisition, Skill } from './skillAcquisition';
import { PatternRecognition, Pattern } from './patternRecognition';
import { FeedbackLoop, Feedback, Improvement } from './feedbackLoop';
import { AdaptiveBehavior, Strategy, BehaviorProfile } from './adaptiveBehavior';
import { LogRepository } from '../db/logRepository';

export class LearningCore {
  private skillAcquisition: SkillAcquisition;
  private patternRecognition: PatternRecognition;
  private feedbackLoop: FeedbackLoop;
  private adaptiveBehavior: AdaptiveBehavior;
  private logRepo: LogRepository;

  constructor() {
    this.skillAcquisition = new SkillAcquisition();
    this.patternRecognition = new PatternRecognition();
    this.feedbackLoop = new FeedbackLoop();
    this.adaptiveBehavior = new AdaptiveBehavior();
    this.logRepo = new LogRepository();
  }

  async learnFromTask(taskId: number, userId: number): Promise<{
    skill: Skill | null;
    patterns: Pattern[];
  }> {
    await this.logRepo.create('Learning from task', null, taskId, userId, 'info');

    const skill = await this.skillAcquisition.extractSkillFromTask(taskId, userId);
    const patterns = await this.patternRecognition.analyzeUserPatterns(userId);

    if (skill) {
      await this.logRepo.create(
        'Skill acquired',
        skill.name,
        taskId,
        userId,
        'info'
      );
    }

    return { skill, patterns };
  }

  async findRelevantSkills(goal: string, userId: number): Promise<Skill[]> {
    return this.skillAcquisition.findRelevantSkills(goal, userId);
  }

  async recordFeedback(feedback: Feedback, userId: number): Promise<void> {
    await this.feedbackLoop.recordFeedback(feedback, userId);
    await this.logRepo.create(
      'Feedback recorded',
      `Rating: ${feedback.rating}/5`,
      feedback.taskId,
      userId,
      'info'
    );
  }

  async analyzePerformance(userId: number): Promise<{
    metrics: any;
    improvements: Improvement[];
    patterns: Pattern[];
    anomalies: any[];
  }> {
    const metrics = await this.feedbackLoop.getPerformanceMetrics(userId);
    const improvements = await this.feedbackLoop.analyzeFeedback(userId);
    const patterns = await this.patternRecognition.analyzeUserPatterns(userId);
    const anomalies = await this.patternRecognition.detectAnomalies(userId);

    return { metrics, improvements, patterns, anomalies };
  }

  async adaptToContext(userId: number, context: string): Promise<Strategy | null> {
    const shouldAdapt = await this.adaptiveBehavior.shouldAdapt(userId);
    
    if (!shouldAdapt) {
      return null;
    }

    const strategy = await this.adaptiveBehavior.adaptStrategy(userId, context);
    
    if (strategy) {
      await this.logRepo.create(
        'Strategy adapted',
        strategy.name,
        undefined,
        userId,
        'info'
      );
    }

    return strategy;
  }

  async updateUserPreferences(userId: number, preferences: Record<string, any>): Promise<void> {
    await this.adaptiveBehavior.updatePreferences(userId, preferences);
  }

  getBehaviorProfile(userId: number): BehaviorProfile | undefined {
    return this.adaptiveBehavior.getProfile(userId);
  }

  async generateLearningReport(userId: number): Promise<{
    skills: Skill[];
    patterns: Pattern[];
    performance: any;
    improvements: Improvement[];
    profile: BehaviorProfile | undefined;
  }> {
    const skills = await this.skillAcquisition.findRelevantSkills('', userId, 10);
    const patterns = await this.patternRecognition.analyzeUserPatterns(userId);
    const performance = await this.feedbackLoop.getPerformanceMetrics(userId);
    const improvements = await this.feedbackLoop.analyzeFeedback(userId);
    const profile = this.adaptiveBehavior.getProfile(userId);

    return { skills, patterns, performance, improvements, profile };
  }
}

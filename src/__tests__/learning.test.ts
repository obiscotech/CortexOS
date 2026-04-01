import { LearningCore } from '../learning/core';

jest.mock('../learning/skillAcquisition');
jest.mock('../learning/patternRecognition');
jest.mock('../learning/feedbackLoop');
jest.mock('../learning/adaptiveBehavior');
jest.mock('../db/logRepository');
jest.mock('../llm/manager', () => ({
  llmManager: {
    generate: jest.fn(),
    generateJSON: jest.fn(),
  },
}));

describe('LearningCore', () => {
  let learningCore: LearningCore;

  beforeEach(() => {
    learningCore = new LearningCore();
    jest.clearAllMocks();
  });

  describe('learnFromTask', () => {
    it('should extract skill and analyze patterns', async () => {
      const mockSkill = {
        id: 1,
        name: 'Test Skill',
        description: 'Test description',
        category: 'automation',
        successRate: 1.0,
        usageCount: 1,
        pattern: 'test pattern',
        metadata: {},
      };

      const { SkillAcquisition } = require('../learning/skillAcquisition');
      const { PatternRecognition } = require('../learning/patternRecognition');
      (SkillAcquisition.prototype.extractSkillFromTask as jest.Mock).mockResolvedValue(mockSkill);
      (PatternRecognition.prototype.analyzeUserPatterns as jest.Mock).mockResolvedValue([]);

      const result = await learningCore.learnFromTask(1, 1);

      expect(result.skill).toEqual(mockSkill);
      expect(result.patterns).toEqual([]);
      expect(SkillAcquisition.prototype.extractSkillFromTask).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('findRelevantSkills', () => {
    it('should find skills matching goal', async () => {
      const mockSkills = [
        {
          id: 1,
          name: 'Skill 1',
          description: 'Description 1',
          category: 'automation',
          successRate: 1.0,
          usageCount: 1,
          pattern: 'pattern 1',
          metadata: {},
        },
      ];

      const { SkillAcquisition } = require('../learning/skillAcquisition');
      (SkillAcquisition.prototype.findRelevantSkills as jest.Mock).mockResolvedValue(mockSkills);

      const skills = await learningCore.findRelevantSkills('test goal', 1);

      expect(skills).toEqual(mockSkills);
      expect(SkillAcquisition.prototype.findRelevantSkills).toHaveBeenCalledWith('test goal', 1);
    });
  });

  describe('recordFeedback', () => {
    it('should record user feedback', async () => {
      const feedback = {
        taskId: 1,
        rating: 5,
        comment: 'Great!',
        timestamp: new Date(),
      };

      const { FeedbackLoop } = require('../learning/feedbackLoop');
      await learningCore.recordFeedback(feedback, 1);

      expect(FeedbackLoop.prototype.recordFeedback).toHaveBeenCalledWith(feedback, 1);
    });
  });

  describe('analyzePerformance', () => {
    it('should analyze user performance', async () => {
      const mockMetrics = {
        totalTasks: 10,
        completedTasks: 8,
        failedTasks: 2,
        successRate: 0.8,
        avgFeedbackRating: 4.5,
      };

      const { FeedbackLoop } = require('../learning/feedbackLoop');
      const { PatternRecognition } = require('../learning/patternRecognition');
      (FeedbackLoop.prototype.getPerformanceMetrics as jest.Mock).mockResolvedValue(mockMetrics);
      (FeedbackLoop.prototype.analyzeFeedback as jest.Mock).mockResolvedValue([]);
      (PatternRecognition.prototype.analyzeUserPatterns as jest.Mock).mockResolvedValue([]);
      (PatternRecognition.prototype.detectAnomalies as jest.Mock).mockResolvedValue([]);

      const analysis = await learningCore.analyzePerformance(1);

      expect(analysis.metrics).toEqual(mockMetrics);
      expect(analysis.improvements).toEqual([]);
      expect(analysis.patterns).toEqual([]);
      expect(analysis.anomalies).toEqual([]);
    });
  });

  describe('adaptToContext', () => {
    it('should adapt strategy when needed', async () => {
      const mockStrategy = {
        name: 'Test Strategy',
        description: 'Test description',
        conditions: ['condition1'],
        actions: ['action1'],
        successRate: 0.9,
      };

      const { AdaptiveBehavior } = require('../learning/adaptiveBehavior');
      (AdaptiveBehavior.prototype.shouldAdapt as jest.Mock).mockResolvedValue(true);
      (AdaptiveBehavior.prototype.adaptStrategy as jest.Mock).mockResolvedValue(mockStrategy);

      const strategy = await learningCore.adaptToContext(1, 'test context');

      expect(strategy).toEqual(mockStrategy);
      expect(AdaptiveBehavior.prototype.adaptStrategy).toHaveBeenCalledWith(1, 'test context');
    });

    it('should return null when adaptation not needed', async () => {
      const { AdaptiveBehavior } = require('../learning/adaptiveBehavior');
      (AdaptiveBehavior.prototype.shouldAdapt as jest.Mock).mockResolvedValue(false);

      const strategy = await learningCore.adaptToContext(1, 'test context');

      expect(strategy).toBeNull();
      expect(AdaptiveBehavior.prototype.adaptStrategy).not.toHaveBeenCalled();
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences', async () => {
      const preferences = { theme: 'dark', language: 'en' };

      const { AdaptiveBehavior } = require('../learning/adaptiveBehavior');
      await learningCore.updateUserPreferences(1, preferences);

      expect(AdaptiveBehavior.prototype.updatePreferences).toHaveBeenCalledWith(1, preferences);
    });
  });

  describe('generateLearningReport', () => {
    it('should generate comprehensive learning report', async () => {
      const mockSkills = [{ id: 1, name: 'Skill 1' }];
      const mockPatterns = [{ id: 'p1', name: 'Pattern 1' }];
      const mockMetrics = { totalTasks: 10 };
      const mockImprovements = [{ area: 'speed' }];
      const mockProfile = { userId: 1, preferences: {} };

      const { SkillAcquisition } = require('../learning/skillAcquisition');
      const { PatternRecognition } = require('../learning/patternRecognition');
      const { FeedbackLoop } = require('../learning/feedbackLoop');
      const { AdaptiveBehavior } = require('../learning/adaptiveBehavior');
      
      (SkillAcquisition.prototype.findRelevantSkills as jest.Mock).mockResolvedValue(mockSkills);
      (PatternRecognition.prototype.analyzeUserPatterns as jest.Mock).mockResolvedValue(mockPatterns);
      (FeedbackLoop.prototype.getPerformanceMetrics as jest.Mock).mockResolvedValue(mockMetrics);
      (FeedbackLoop.prototype.analyzeFeedback as jest.Mock).mockResolvedValue(mockImprovements);
      (AdaptiveBehavior.prototype.getProfile as jest.Mock).mockReturnValue(mockProfile);

      const report = await learningCore.generateLearningReport(1);

      expect(report.skills).toEqual(mockSkills);
      expect(report.patterns).toEqual(mockPatterns);
      expect(report.performance).toEqual(mockMetrics);
      expect(report.improvements).toEqual(mockImprovements);
      expect(report.profile).toEqual(mockProfile);
    });
  });
});

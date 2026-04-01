export type JobStatus = 'pending' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

export interface ScheduledJob {
  id: string;
  taskId: number;
  userId: number;
  status: JobStatus;
  priority: JobPriority;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface CronSchedule {
  id: number;
  name: string;
  taskGoal: string;
  cronExpression: string;
  userId: number;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  metadata: Record<string, unknown>;
}

export interface JobOptions {
  priority?: JobPriority;
  delay?: number;
  maxAttempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  metadata?: Record<string, unknown>;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffType: 'fixed' | 'exponential';
  baseDelay: number;
  maxDelay?: number;
}

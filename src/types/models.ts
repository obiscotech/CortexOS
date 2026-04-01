export type TaskStatus = 'pending' | 'planning' | 'executing' | 'completed' | 'failed' | 'paused';
export type StepStatus = 'pending' | 'executing' | 'completed' | 'failed';
export type MemoryType = 'short_term' | 'long_term' | 'skill' | 'context';
export type UserRole = 'master' | 'agent' | 'sub_agent';
export type LogLevel = 'info' | 'warning' | 'error' | 'critical';

export interface User {
  id: number;
  uuid: string;
  username: string;
  role: UserRole;
  api_key: string | null;
  permissions: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: number;
  uuid: string;
  goal: string;
  status: TaskStatus;
  priority: number;
  parent_task_id: number | null;
  created_by: number | null;
  assigned_to: number | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Step {
  id: number;
  uuid: string;
  task_id: number;
  action: string;
  status: StepStatus;
  result: string | null;
  error: string | null;
  retry_count: number;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Memory {
  id: number;
  uuid: string;
  content: string;
  type: MemoryType;
  embedding: number[] | null;
  score: number;
  task_id: number | null;
  user_id: number | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface Log {
  id: number;
  uuid: string;
  task_id: number | null;
  user_id: number | null;
  action: string;
  result: string | null;
  level: LogLevel;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

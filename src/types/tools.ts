export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Tool {
  name: string;
  description: string;
  execute(params: Record<string, unknown>): Promise<ToolResult>;
  validate(params: Record<string, unknown>): boolean;
}

export interface ToolExecutionContext {
  taskId: number;
  userId: number;
  permissions: Record<string, unknown>;
}

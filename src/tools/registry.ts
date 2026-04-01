import { Tool, ToolResult, ToolExecutionContext } from '../types/tools';
import { BrowserTool } from './browser';
import { TerminalTool } from './terminal';
import { FileTool } from './file';
import { LogRepository } from '../db/logRepository';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private logRepo: LogRepository;

  constructor() {
    this.logRepo = new LogRepository();
    this.registerDefaultTools();
  }

  private registerDefaultTools(): void {
    this.register(new BrowserTool());
    this.register(new TerminalTool());
    this.register(new FileTool());
  }

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  listTools(): Array<{ name: string; description: string }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
    }));
  }

  async execute(
    toolName: string,
    params: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const tool = this.getTool(toolName);

    if (!tool) {
      const error = `Tool not found: ${toolName}`;
      await this.logRepo.create(
        `Tool execution failed: ${toolName}`,
        error,
        context.taskId,
        context.userId,
        'error'
      );
      return { success: false, output: '', error };
    }

    if (!this.hasPermission(context.permissions, toolName)) {
      const error = `Permission denied for tool: ${toolName}`;
      await this.logRepo.create(
        `Tool execution denied: ${toolName}`,
        error,
        context.taskId,
        context.userId,
        'warning'
      );
      return { success: false, output: '', error };
    }

    if (!tool.validate(params)) {
      const error = `Invalid parameters for tool: ${toolName}`;
      await this.logRepo.create(
        `Tool validation failed: ${toolName}`,
        JSON.stringify(params),
        context.taskId,
        context.userId,
        'error'
      );
      return { success: false, output: '', error };
    }

    await this.logRepo.create(
      `Executing tool: ${toolName}`,
      JSON.stringify(params),
      context.taskId,
      context.userId,
      'info'
    );

    const result = await tool.execute(params);

    await this.logRepo.create(
      `Tool execution ${result.success ? 'completed' : 'failed'}: ${toolName}`,
      result.success ? result.output : result.error || 'Unknown error',
      context.taskId,
      context.userId,
      result.success ? 'info' : 'error'
    );

    return result;
  }

  private hasPermission(permissions: Record<string, unknown>, toolName: string): boolean {
    if (permissions.all === true) {
      return true;
    }

    const tools = permissions.tools as Record<string, boolean> | undefined;
    return tools?.[toolName] === true;
  }
}

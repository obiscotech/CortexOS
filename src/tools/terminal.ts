import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool, ToolResult } from '../types/tools';

const execAsync = promisify(exec);

export class TerminalTool implements Tool {
  name = 'terminal';
  description = 'Execute shell commands';
  private allowedCommands = ['ls', 'pwd', 'cat', 'echo', 'grep', 'find', 'curl', 'wget'];
  private blockedPatterns = ['rm -rf', 'sudo', 'chmod', 'chown', 'mkfs', 'dd'];

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const command = params.command as string;
    const cwd = params.cwd as string | undefined;

    try {
      if (!this.isCommandSafe(command)) {
        return {
          success: false,
          output: '',
          error: 'Command blocked for security reasons',
        };
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || process.cwd(),
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      });

      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
        metadata: { command, cwd },
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Command execution failed',
        metadata: { command, cwd },
      };
    }
  }

  validate(params: Record<string, unknown>): boolean {
    return typeof params.command === 'string' && params.command.length > 0;
  }

  private isCommandSafe(command: string): boolean {
    for (const pattern of this.blockedPatterns) {
      if (command.includes(pattern)) {
        return false;
      }
    }

    const baseCommand = command.trim().split(' ')[0];
    
    return (
      this.allowedCommands.includes(baseCommand) ||
      baseCommand.startsWith('npm') ||
      baseCommand.startsWith('node') ||
      baseCommand.startsWith('git')
    );
  }
}

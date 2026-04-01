import { readFile, writeFile, appendFile, unlink, mkdir, readdir, stat } from 'fs/promises';
import { resolve } from 'path';
import { Tool, ToolResult } from '../types/tools';

export class FileTool implements Tool {
  name = 'file';
  description = 'Read, write, and manage files';
  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || process.cwd();
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const action = params.action as string;

    try {
      switch (action) {
        case 'read':
          return await this.read(params.path as string);
        case 'write':
          return await this.write(params.path as string, params.content as string);
        case 'append':
          return await this.append(params.path as string, params.content as string);
        case 'delete':
          return await this.delete(params.path as string);
        case 'list':
          return await this.list(params.path as string);
        case 'mkdir':
          return await this.makeDirectory(params.path as string);
        case 'stat':
          return await this.getStat(params.path as string);
        default:
          return { success: false, output: '', error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'File operation failed',
      };
    }
  }

  validate(params: Record<string, unknown>): boolean {
    const action = params.action as string;
    if (!action) return false;

    switch (action) {
      case 'read':
      case 'delete':
      case 'list':
      case 'mkdir':
      case 'stat':
        return typeof params.path === 'string';
      case 'write':
      case 'append':
        return typeof params.path === 'string' && typeof params.content === 'string';
      default:
        return false;
    }
  }

  private resolvePath(path: string): string {
    const resolved = resolve(this.workspaceRoot, path);
    
    if (!resolved.startsWith(this.workspaceRoot)) {
      throw new Error('Access denied: Path outside workspace');
    }
    
    return resolved;
  }

  private async read(path: string): Promise<ToolResult> {
    const fullPath = this.resolvePath(path);
    const content = await readFile(fullPath, 'utf-8');
    return {
      success: true,
      output: content,
      metadata: { path: fullPath, size: content.length },
    };
  }

  private async write(path: string, content: string): Promise<ToolResult> {
    const fullPath = this.resolvePath(path);
    await writeFile(fullPath, content, 'utf-8');
    return {
      success: true,
      output: `File written: ${fullPath}`,
      metadata: { path: fullPath, size: content.length },
    };
  }

  private async append(path: string, content: string): Promise<ToolResult> {
    const fullPath = this.resolvePath(path);
    await appendFile(fullPath, content, 'utf-8');
    return {
      success: true,
      output: `Content appended to: ${fullPath}`,
      metadata: { path: fullPath },
    };
  }

  private async delete(path: string): Promise<ToolResult> {
    const fullPath = this.resolvePath(path);
    await unlink(fullPath);
    return {
      success: true,
      output: `File deleted: ${fullPath}`,
      metadata: { path: fullPath },
    };
  }

  private async list(path: string): Promise<ToolResult> {
    const fullPath = this.resolvePath(path);
    const files = await readdir(fullPath);
    return {
      success: true,
      output: files.join('\n'),
      metadata: { path: fullPath, count: files.length, files },
    };
  }

  private async makeDirectory(path: string): Promise<ToolResult> {
    const fullPath = this.resolvePath(path);
    await mkdir(fullPath, { recursive: true });
    return {
      success: true,
      output: `Directory created: ${fullPath}`,
      metadata: { path: fullPath },
    };
  }

  private async getStat(path: string): Promise<ToolResult> {
    const fullPath = this.resolvePath(path);
    const stats = await stat(fullPath);
    return {
      success: true,
      output: JSON.stringify(stats, null, 2),
      metadata: {
        path: fullPath,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        modified: stats.mtime,
      },
    };
  }
}

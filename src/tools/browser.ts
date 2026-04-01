import { chromium, Browser, Page } from 'playwright';
import { Tool, ToolResult } from '../types/tools';

export class BrowserTool implements Tool {
  name = 'browser';
  description = 'Navigate web pages, click elements, extract data';
  private browser: Browser | null = null;
  private page: Page | null = null;

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const action = params.action as string;

    try {
      switch (action) {
        case 'navigate':
          return await this.navigate(params.url as string);
        case 'click':
          return await this.click(params.selector as string);
        case 'type':
          return await this.type(params.selector as string, params.text as string);
        case 'extract':
          return await this.extract(params.selector as string);
        case 'screenshot':
          return await this.screenshot(params.path as string);
        case 'close':
          return await this.close();
        default:
          return { success: false, output: '', error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  validate(params: Record<string, unknown>): boolean {
    const action = params.action as string;
    if (!action) return false;

    switch (action) {
      case 'navigate':
        return typeof params.url === 'string';
      case 'click':
      case 'extract':
        return typeof params.selector === 'string';
      case 'type':
        return typeof params.selector === 'string' && typeof params.text === 'string';
      case 'screenshot':
        return typeof params.path === 'string';
      case 'close':
        return true;
      default:
        return false;
    }
  }

  private async ensureBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
      this.page = await this.browser.newPage();
    }
  }

  private async navigate(url: string): Promise<ToolResult> {
    await this.ensureBrowser();
    await this.page!.goto(url);
    const title = await this.page!.title();
    return {
      success: true,
      output: `Navigated to ${url}`,
      metadata: { title, url },
    };
  }

  private async click(selector: string): Promise<ToolResult> {
    await this.ensureBrowser();
    await this.page!.click(selector);
    return {
      success: true,
      output: `Clicked element: ${selector}`,
    };
  }

  private async type(selector: string, text: string): Promise<ToolResult> {
    await this.ensureBrowser();
    await this.page!.fill(selector, text);
    return {
      success: true,
      output: `Typed text into: ${selector}`,
    };
  }

  private async extract(selector: string): Promise<ToolResult> {
    await this.ensureBrowser();
    const content = await this.page!.textContent(selector);
    return {
      success: true,
      output: content || '',
      metadata: { selector },
    };
  }

  private async screenshot(path: string): Promise<ToolResult> {
    await this.ensureBrowser();
    await this.page!.screenshot({ path });
    return {
      success: true,
      output: `Screenshot saved to: ${path}`,
      metadata: { path },
    };
  }

  private async close(): Promise<ToolResult> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    return {
      success: true,
      output: 'Browser closed',
    };
  }
}

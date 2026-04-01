import { LLMProvider, LLMMessage, LLMResponse, LLMOptions, ModelProvider } from '../types/llm';
import { GroqProvider } from './groq';
import { ClaudeProvider } from './claude';
import { MistralProvider } from './mistral';
import { GeminiProvider } from './gemini';
import dotenv from 'dotenv';

dotenv.config();

export class LLMManager {
  private providers: Map<ModelProvider, LLMProvider> = new Map();
  private defaultProvider: ModelProvider;

  constructor() {
    this.defaultProvider = (process.env.DEFAULT_LLM_PROVIDER as ModelProvider) || 'groq';
    this.initializeProviders();
  }

  private initializeProviders(): void {
    if (process.env.GROQ_API_KEY) {
      this.providers.set('groq', new GroqProvider(process.env.GROQ_API_KEY));
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('claude', new ClaudeProvider(process.env.ANTHROPIC_API_KEY));
    }

    if (process.env.MISTRAL_API_KEY) {
      this.providers.set('mistral', new MistralProvider(process.env.MISTRAL_API_KEY));
    }

    if (process.env.GEMINI_API_KEY) {
      this.providers.set('gemini', new GeminiProvider(process.env.GEMINI_API_KEY));
    }
  }

  getProvider(provider?: ModelProvider): LLMProvider {
    const targetProvider = provider || this.defaultProvider;
    const llm = this.providers.get(targetProvider);

    if (!llm) {
      throw new Error(`LLM provider '${targetProvider}' not configured. Check API keys.`);
    }

    return llm;
  }

  async generate(
    messages: LLMMessage[],
    options?: LLMOptions & { provider?: ModelProvider }
  ): Promise<LLMResponse> {
    const provider = this.getProvider(options?.provider);
    return provider.generate(messages, options);
  }

  async generateJSON(
    messages: LLMMessage[],
    options?: LLMOptions & { provider?: ModelProvider }
  ): Promise<LLMResponse> {
    const provider = this.getProvider(options?.provider);
    return provider.generateJSON(messages, options);
  }

  listAvailableProviders(): ModelProvider[] {
    return Array.from(this.providers.keys());
  }
}

export const llmManager = new LLMManager();

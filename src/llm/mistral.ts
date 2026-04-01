import { Mistral } from '@mistralai/mistralai';
import { LLMProvider, LLMMessage, LLMResponse, LLMOptions } from '../types/llm';

export class MistralProvider implements LLMProvider {
  name = 'mistral';
  private client: Mistral;
  private defaultModel = 'mistral-large-latest';

  constructor(apiKey: string) {
    this.client = new Mistral({ apiKey });
  }

  async generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const response = await this.client.chat.complete({
      model: options?.model || this.defaultModel,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2048,
    });

    const content = response.choices?.[0]?.message?.content;
    return {
      content: typeof content === 'string' ? content : '',
      model: response.model || this.defaultModel,
      usage: {
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: response.usage?.completionTokens || 0,
        totalTokens: response.usage?.totalTokens || 0,
      },
    };
  }

  async generateJSON(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const response = await this.client.chat.complete({
      model: options?.model || this.defaultModel,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2048,
      responseFormat: { type: 'json_object' },
    });

    const content = response.choices?.[0]?.message?.content;
    return {
      content: typeof content === 'string' ? content : '',
      model: response.model || this.defaultModel,
      usage: {
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: response.usage?.completionTokens || 0,
        totalTokens: response.usage?.totalTokens || 0,
      },
    };
  }
}

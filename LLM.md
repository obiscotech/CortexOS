# Multi-Model LLM Support

## Overview

CortexOS supports multiple LLM providers with a unified interface:
- **Groq** (Default) - Fast inference with Llama models
- **Claude** - Anthropic's Claude 3.5 Sonnet
- **Mistral** - Mistral Large
- **Gemini** - Google's Gemini 1.5 Pro

## Configuration

Add API keys to `.env`:

```bash
# Choose default provider
DEFAULT_LLM_PROVIDER=groq

# Add at least one API key
GROQ_API_KEY=your_groq_api_key
ANTHROPIC_API_KEY=your_claude_api_key
MISTRAL_API_KEY=your_mistral_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## Usage

### Basic Generation

```typescript
import { llmManager } from './llm/manager';

// Use default provider
const response = await llmManager.generate([
  { role: 'user', content: 'Hello!' }
]);

// Use specific provider
const response = await llmManager.generate(
  [{ role: 'user', content: 'Hello!' }],
  { provider: 'claude' }
);
```

### JSON Generation

```typescript
const response = await llmManager.generateJSON([
  { role: 'user', content: 'Return user data as JSON' }
]);

const data = JSON.parse(response.content);
```

### With Options

```typescript
const response = await llmManager.generate(
  [{ role: 'user', content: 'Write a story' }],
  {
    provider: 'gemini',
    temperature: 0.9,
    maxTokens: 4096,
    model: 'gemini-1.5-pro'
  }
);
```

## Default Models

- **Groq**: llama-3.1-70b-versatile
- **Claude**: claude-3-5-sonnet-20241022
- **Mistral**: mistral-large-latest
- **Gemini**: gemini-1.5-pro

## Provider Features

### Groq
- Fastest inference
- JSON mode support
- Cost-effective
- Llama 3.1 models

### Claude
- Best reasoning
- Long context (200K tokens)
- System prompts
- JSON via instruction

### Mistral
- European provider
- JSON mode support
- Multilingual
- Code generation

### Gemini
- Google's latest
- Native JSON mode
- Multimodal support
- Long context

## Embeddings

Embeddings are handled by **Pinecone's inference API** (text-embedding-3-small).

No OpenAI API key needed for embeddings when using Pinecone.

## List Available Providers

```typescript
const providers = llmManager.listAvailableProviders();
console.log(providers); // ['groq', 'claude', 'mistral', 'gemini']
```

## Error Handling

```typescript
try {
  const response = await llmManager.generate(
    [{ role: 'user', content: 'Hello' }],
    { provider: 'claude' }
  );
} catch (error) {
  // Provider not configured or API error
  console.error(error.message);
}
```

## Testing

All providers are mocked in tests. No API keys needed for testing.

## Cost Optimization

1. Use **Groq** for fast, cheap inference
2. Use **Claude** for complex reasoning
3. Use **Mistral** for European compliance
4. Use **Gemini** for multimodal tasks

## Token Usage

All providers return token usage:

```typescript
const response = await llmManager.generate([...]);
console.log(response.usage);
// {
//   promptTokens: 10,
//   completionTokens: 50,
//   totalTokens: 60
// }
```

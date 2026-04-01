import { llmManager } from '../llm/manager';
import { ModelProvider } from '../types/llm';

export interface PlanStep {
  action: string;
  reasoning: string;
}

export async function generatePlan(
  goal: string,
  provider?: ModelProvider
): Promise<PlanStep[]> {
  const prompt = `You are CortexOS Brain Core. Break down this goal into executable steps.

Goal: ${goal}

Return a JSON object with a "steps" array. Each step should have:
- action: step description
- reasoning: why this step

Format: {"steps": [{"action": "...", "reasoning": "..."}]}

Keep steps atomic and executable. Maximum 5 steps.`;

  const response = await llmManager.generateJSON(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, provider }
  );

  const parsed = JSON.parse(response.content);
  return parsed.steps || [];
}

export { llmManager };

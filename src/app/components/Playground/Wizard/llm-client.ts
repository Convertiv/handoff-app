const LLM_KEY_STORAGE = 'handoff-playground-llm-key';
const LLM_MODEL_STORAGE = 'handoff-playground-llm-model';

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface LLMResponse {
  content: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LLM_KEY_STORAGE);
}

export function setApiKey(key: string): void {
  localStorage.setItem(LLM_KEY_STORAGE, key);
}

export function clearApiKey(): void {
  localStorage.removeItem(LLM_KEY_STORAGE);
}

export function getModel(): string {
  if (typeof window === 'undefined') return 'gpt-4o-mini';
  return localStorage.getItem(LLM_MODEL_STORAGE) || 'gpt-4o-mini';
}

export function setModel(model: string): void {
  localStorage.setItem(LLM_MODEL_STORAGE, model);
}

export const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (fast, low cost)' },
  { id: 'gpt-4o', label: 'GPT-4o (higher quality)' },
] as const;

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Please add your OpenAI API key in settings.');
  }

  const model = getModel();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
    }
    if (response.status === 429) {
      throw new Error('Rate limited by OpenAI. Please wait a moment and try again.');
    }
    throw new Error(`OpenAI API error (${response.status}): ${body}`);
  }

  const json = await response.json();
  const choice = json.choices?.[0];
  if (!choice?.message?.content) {
    throw new Error('Empty response from OpenAI.');
  }

  return {
    content: choice.message.content,
    usage: json.usage,
  };
}

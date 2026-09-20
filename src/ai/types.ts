/**
 * Server-only AI provider contract for connections that are not OpenAI-compatible.
 *
 * Every built-in connection speaks the OpenAI-compatible `/chat/completions` API and needs no
 * adapter — Ollama, LiteLLM, OpenRouter, vLLM, LM Studio and Azure OpenAI all serve it, and each of
 * them fronts Anthropic, Google and xAI models. A provider that fits nothing else names a
 * {@link defineAiProvider} module instead of a base URL.
 */

import type { LanguageModel } from 'ai';

/** Context passed to a custom provider factory: its non-secret options, the process env, and the resolved key. */
export interface AiProviderContext {
  /** Non-secret options from the connection's `options`. Put env-var *names* here, never values. */
  options: Record<string, unknown>;
  /** The process environment. Read secret *values* here by the env-var *names* carried in options. */
  env: NodeJS.ProcessEnv;
  /**
   * The resolved key for this request: the deployment's own key for a service connection, or the
   * reader's saved key for a `credential: 'user'` connection. Undefined when neither applies.
   */
  apiKey?: string;
}

/** The pluggable provider contract: resolve one of the connection's declared models. */
export interface AiProvider {
  languageModel(modelId: string): LanguageModel;
}

/** A custom provider may export the provider directly or a factory that builds it from its context. */
export type AiProviderFactory = (context: AiProviderContext) => AiProvider | Promise<AiProvider>;

import type { LLMProvider } from "./types.js";
import type { LLMProviderConfig } from "./types.js";
import { OpenAIProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";

export type { LLMProvider, LLMProviderConfig };

export function createLLMProvider(config: LLMProviderConfig): LLMProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config.apiKey, config.model, config.baseUrl);
    case "anthropic":
      return new AnthropicProvider(config.apiKey, config.model, config.baseUrl);
    case "custom":
      // For custom OpenAI-compatible endpoints
      return new OpenAIProvider(config.apiKey, config.model ?? "default", config.baseUrl);
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

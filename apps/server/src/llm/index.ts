import type { LLMProvider } from "./types.js";
import type { LLMProviderConfig } from "./types.js";
import { OpenAIProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";
import { ArinovaProvider } from "./arinova.js";

export type { LLMProvider, LLMProviderConfig };
export { ArinovaProvider };

export function createLLMProvider(config: LLMProviderConfig): LLMProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config.apiKey, config.model, config.baseUrl);
    case "anthropic":
      return new AnthropicProvider(config.apiKey, config.model, config.baseUrl);
    case "custom":
      // For custom OpenAI-compatible endpoints
      return new OpenAIProvider(config.apiKey, config.model ?? "default", config.baseUrl);
    case "arinova":
      return new ArinovaProvider(config.apiKey, config.model ?? "");
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

import type { LLMMessage, LLMProvider } from "@who-is-killer/shared/types";

export type { LLMMessage, LLMProvider };

export interface LLMProviderConfig {
  provider: "openai" | "anthropic" | "custom";
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

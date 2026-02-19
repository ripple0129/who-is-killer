import type { LLMMessage, LLMProvider } from "./types.js";

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey: string, model = "claude-sonnet-4-5-20250929", baseUrl = "https://api.anthropic.com") {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const systemMsg = messages.find((m) => m.role === "system");
    const nonSystemMsgs = messages.filter((m) => m.role !== "system");

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        system: systemMsg?.content,
        messages: nonSystemMsgs.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = (await response.json()) as { content: { type: string; text: string }[] };
    return data.content[0]?.text ?? "";
  }
}

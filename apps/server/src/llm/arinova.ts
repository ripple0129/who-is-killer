import type { LLMMessage, LLMProvider } from "./types.js";

const ARINOVA_BASE_URL = process.env.ARINOVA_URL ?? "http://192.168.68.83:21001";

export class ArinovaProvider implements LLMProvider {
  name = "arinova";
  private accessToken: string;
  private agentId: string;

  constructor(accessToken: string, agentId: string) {
    this.accessToken = accessToken;
    this.agentId = agentId;
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const res = await fetch(`${ARINOVA_BASE_URL}/api/v1/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        agent_id: this.agentId,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Arinova agent chat failed: ${err}`);
    }

    const data = await res.json();
    return data.response ?? "";
  }
}

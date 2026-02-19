import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { config } from "dotenv";
import { createLLMProvider } from "./llm/index.js";
import { GameEngine } from "./game/engine.js";
import { registerRoutes } from "./routes/index.js";
import { registerWebSocket } from "./routes/ws.js";

config();

const PORT = Number(process.env.PORT ?? 3601);
const HOST = process.env.HOST ?? "0.0.0.0";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(websocket);

  // Initialize LLM provider
  const llmProvider = createLLMProvider({
    provider: (process.env.LLM_PROVIDER as "openai" | "anthropic" | "custom") ?? "openai",
    apiKey: process.env.LLM_API_KEY ?? "",
    model: process.env.LLM_MODEL,
    baseUrl: process.env.LLM_BASE_URL,
  });

  // Create game engine
  const connections = new Map<string, Map<string, import("ws").WebSocket>>(); // roomId -> playerId -> ws

  const engine = new GameEngine(llmProvider, (roomId, event) => {
    const roomConns = connections.get(roomId);
    if (!roomConns) return;
    const msg = JSON.stringify(event);
    for (const ws of roomConns.values()) {
      if (ws.readyState === ws.OPEN) {
        ws.send(msg);
      }
    }
  });

  // Register routes
  registerRoutes(app, engine);
  registerWebSocket(app, engine, connections);

  await app.listen({ port: PORT, host: HOST });
  console.log(`Server running on http://${HOST}:${PORT}`);
}

main().catch(console.error);

import type { FastifyInstance } from "fastify";
import type { GameEngine } from "../game/engine.js";
import { createRoomSchema, joinRoomSchema } from "@who-is-killer/shared/schemas";

const ARINOVA_URL = process.env.ARINOVA_URL ?? "http://192.168.68.83:21001";
const ARINOVA_CLIENT_ID = process.env.ARINOVA_CLIENT_ID ?? "who-is-killer";
const ARINOVA_CLIENT_SECRET = process.env.ARINOVA_CLIENT_SECRET ?? "";

export function registerRoutes(app: FastifyInstance, engine: GameEngine) {
  // Health check
  app.get("/", async () => ({ status: "ok" }));
  app.get("/api/health", async () => ({ status: "ok" }));

  // OAuth callback — exchange code for token via Arinova
  app.post("/api/auth/callback", async (request, reply) => {
    const { code } = request.body as { code: string };
    if (!code) return reply.code(400).send({ error: "Missing code" });

    const redirectUri =
      (request.headers.origin ?? request.headers.referer?.replace(/\/callback.*$/, "")) + "/callback";

    const tokenRes = await fetch(`${ARINOVA_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: ARINOVA_CLIENT_ID,
        client_secret: ARINOVA_CLIENT_SECRET,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return reply.code(401).send({ error: "Auth failed", detail: err });
    }

    const data = await tokenRes.json();

    // Fetch agents server-side to avoid CORS issues
    let agents: unknown[] = [];
    try {
      const agentRes = await fetch(`${ARINOVA_URL}/api/v1/user/agents`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (agentRes.ok) {
        const agentData = await agentRes.json();
        agents = agentData.agents ?? [];
      }
    } catch {
      // Non-critical — user can still log in without agents
    }

    return {
      user: data.user,
      accessToken: data.access_token,
      agents,
    };
  });

  // Create room
  app.post("/api/rooms", async (request, reply) => {
    const body = createRoomSchema.parse(request.body);
    const result = engine.createRoom(body.playerName, body.agentId, body.agentName);

    // Store player agent info if provided
    if (body.accessToken && body.agentId) {
      engine.setPlayerAgent(result.playerId, body.accessToken, body.agentId);
    }

    return reply.code(201).send({
      roomId: result.room.id,
      playerId: result.playerId,
      room: result.room,
    });
  });

  // Get room info
  app.get<{ Params: { roomId: string } }>("/api/rooms/:roomId", async (request, reply) => {
    const room = engine.getRoom(request.params.roomId);
    if (!room) return reply.code(404).send({ error: "Room not found" });
    return room;
  });

  // Join room
  app.post<{ Params: { roomId: string } }>("/api/rooms/:roomId/join", async (request, reply) => {
    const body = joinRoomSchema.parse(request.body);
    const result = engine.joinRoom(body.roomId, body.playerName, body.agentId, body.agentName);
    if (!result) return reply.code(400).send({ error: "Cannot join room" });

    // Store player agent info if provided
    if (body.accessToken && body.agentId) {
      engine.setPlayerAgent(result.playerId, body.accessToken, body.agentId);
    }

    return {
      playerId: result.playerId,
      room: result.room,
    };
  });
}

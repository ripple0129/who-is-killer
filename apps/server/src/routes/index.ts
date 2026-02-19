import type { FastifyInstance } from "fastify";
import type { GameEngine } from "../game/engine.js";
import { createRoomSchema, joinRoomSchema } from "@who-is-killer/shared/schemas";

export function registerRoutes(app: FastifyInstance, engine: GameEngine) {
  // Health check
  app.get("/api/health", async () => ({ status: "ok" }));

  // Create room
  app.post("/api/rooms", async (request, reply) => {
    const body = createRoomSchema.parse(request.body);
    const result = engine.createRoom(body.playerName);
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
    const result = engine.joinRoom(body.roomId, body.playerName);
    if (!result) return reply.code(400).send({ error: "Cannot join room" });
    return {
      playerId: result.playerId,
      room: result.room,
    };
  });
}

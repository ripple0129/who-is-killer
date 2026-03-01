import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import type { GameEngine } from "../game/engine.js";
import type { ClientEvent } from "@who-is-killer/shared/types";

export function registerWebSocket(
  app: FastifyInstance,
  engine: GameEngine,
  connections: Map<string, Map<string, WebSocket>>,
) {
  app.get("/ws", { websocket: true }, (socket, request) => {
    let roomId = "";
    let playerId = "";

    socket.on("message", async (raw) => {
      try {
        const event: ClientEvent = JSON.parse(raw.toString());

        switch (event.type) {
          case "join_room": {
            roomId = event.roomId;
            // Player should already exist from HTTP join
            const room = engine.getRoom(roomId);
            if (!room) {
              socket.send(JSON.stringify({ type: "error", message: "Room not found" }));
              return;
            }

            const player = room.players.find((p) => p.name === event.playerName);
            if (!player) {
              socket.send(JSON.stringify({ type: "error", message: "Player not found" }));
              return;
            }

            playerId = player.id;
            player.connected = true;

            // Store agent info if provided via WS
            if (event.accessToken && event.agentId) {
              engine.setPlayerAgent(playerId, event.accessToken, event.agentId);
            }

            // Register connection
            if (!connections.has(roomId)) {
              connections.set(roomId, new Map());
            }
            connections.get(roomId)!.set(playerId, socket);

            // Send current room state
            socket.send(JSON.stringify({ type: "room_state", room }));
            break;
          }

          case "start_game": {
            if (!roomId) return;
            const room = engine.getRoom(roomId);
            if (!room || room.hostId !== playerId) return;

            await engine.startGame(roomId);
            break;
          }

          case "send_message": {
            if (!roomId || !playerId) return;
            await engine.handlePlayerMessage(
              roomId,
              playerId,
              event.chatRoom,
              event.content,
              event.targetSuspectId,
            );
            break;
          }

          case "vote": {
            if (!roomId || !playerId) return;
            engine.castVote(roomId, playerId, event.suspectId);
            break;
          }

          case "ready_next_phase": {
            // Could be used for manual phase advancement
            break;
          }
        }
      } catch (err) {
        socket.send(JSON.stringify({ type: "error", message: "Invalid message" }));
      }
    });

    socket.on("close", () => {
      if (roomId && playerId) {
        const roomConns = connections.get(roomId);
        if (roomConns) {
          roomConns.delete(playerId);
          if (roomConns.size === 0) {
            connections.delete(roomId);
          }
        }
        const room = engine.getRoom(roomId);
        if (room) {
          const player = room.players.find((p) => p.id === playerId);
          if (player) player.connected = false;
        }
      }
    });
  });
}

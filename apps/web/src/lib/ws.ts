import type { ServerEvent, ClientEvent } from "@who-is-killer/shared/types";
import { useGameStore } from "@/stores/game";
import { WS_URL } from "./api";

let socket: WebSocket | null = null;

export function connectWebSocket(roomId: string, playerName: string) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.close();
  }

  socket = new WebSocket(WS_URL);
  const store = useGameStore.getState();

  socket.onopen = () => {
    store.setConnected(true);
    store.setWebSocket(socket);
    sendEvent({ type: "join_room", roomId, playerName });
  };

  socket.onmessage = (evt) => {
    const event: ServerEvent = JSON.parse(evt.data);
    handleServerEvent(event);
  };

  socket.onclose = () => {
    store.setConnected(false);
    store.setWebSocket(null);
  };

  socket.onerror = () => {
    store.setConnected(false);
  };
}

export function sendEvent(event: ClientEvent) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(event));
  }
}

export function disconnectWebSocket() {
  socket?.close();
  socket = null;
}

function handleServerEvent(event: ServerEvent) {
  const store = useGameStore.getState();

  switch (event.type) {
    case "room_state":
      store.setRoom(event.room);
      break;
    case "player_joined":
      if (store.room) {
        store.setRoom({
          ...store.room,
          players: [...store.room.players, event.player],
        });
      }
      break;
    case "player_left":
      if (store.room) {
        store.setRoom({
          ...store.room,
          players: store.room.players.filter((p) => p.id !== event.playerId),
        });
      }
      break;
    case "phase_change":
      store.setPhase(event.phase, event.subPhase, event.round);
      // Auto-switch tab based on phase
      if (event.subPhase === "detective_room") {
        store.setActiveTab("detective");
      } else if (event.subPhase === "private_interrogation") {
        store.setActiveTab("private");
      } else {
        store.setActiveTab("public");
      }
      break;
    case "clue_revealed":
      store.addClue(event.clue);
      break;
    case "chat_message":
      store.addMessage(event.message);
      break;
    case "vote_result":
      // Handled by reveal
      break;
    case "game_reveal":
      store.setScores(event.scores);
      store.setRevealedScript(event.script);
      break;
    case "error":
      console.error("Server error:", event.message);
      break;
  }
}

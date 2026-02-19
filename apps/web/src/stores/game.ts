import { create } from "zustand";
import type { GameRoom, ChatMessage, Clue, ScoreResult, GamePhase, RoundSubPhase } from "@who-is-killer/shared/types";

interface GameState {
  // Connection
  roomId: string | null;
  playerId: string | null;
  playerName: string | null;
  ws: WebSocket | null;

  // Game state
  room: GameRoom | null;
  messages: ChatMessage[];
  clues: Clue[];
  scores: Record<string, number> | null;
  revealedScript: GameRoom["script"] | null;

  // UI state
  activeTab: "public" | "private" | "detective";
  isConnected: boolean;

  // Actions
  setConnection: (roomId: string, playerId: string, playerName: string) => void;
  setWebSocket: (ws: WebSocket | null) => void;
  setRoom: (room: GameRoom) => void;
  addMessage: (message: ChatMessage) => void;
  addClue: (clue: Clue) => void;
  setPhase: (phase: GamePhase, subPhase: RoundSubPhase | null, round: number) => void;
  setScores: (scores: Record<string, number>) => void;
  setRevealedScript: (script: GameRoom["script"]) => void;
  setActiveTab: (tab: "public" | "private" | "detective") => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

const initialState = {
  roomId: null,
  playerId: null,
  playerName: null,
  ws: null,
  room: null,
  messages: [],
  clues: [],
  scores: null,
  revealedScript: null,
  activeTab: "public" as const,
  isConnected: false,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setConnection: (roomId, playerId, playerName) =>
    set({ roomId, playerId, playerName }),

  setWebSocket: (ws) => set({ ws }),

  setRoom: (room) => set({ room }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  addClue: (clue) =>
    set((state) => ({ clues: [...state.clues, clue] })),

  setPhase: (phase, subPhase, round) =>
    set((state) => ({
      room: state.room
        ? { ...state.room, phase, currentSubPhase: subPhase, currentRound: round }
        : null,
    })),

  setScores: (scores) => set({ scores }),

  setRevealedScript: (script) => set({ revealedScript: script }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setConnected: (connected) => set({ isConnected: connected }),

  reset: () => set(initialState),
}));

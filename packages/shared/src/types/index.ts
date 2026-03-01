// ===== Game Core Types =====

export type GamePhase =
  | "lobby"        // 等待玩家加入
  | "briefing"     // Phase 0: 案件簡報
  | "round"        // Phase 1-3: 調查回合
  | "final_debate" // Phase 4: 最終辯論
  | "final_meeting"// Phase 5: 偵探最終會議
  | "voting"       // Phase 6: 投票
  | "tiebreaker"   // 平票加賽
  | "reveal";      // Phase 7: 真相揭曉

export type RoundSubPhase =
  | "clue"           // 線索公布
  | "testimony"      // AI 公開供詞
  | "interrogation"  // 公開質問
  | "private_interrogation" // 私人偵訊
  | "detective_room"; // 偵探密室

export type SuspectRole = "innocent" | "killer";

export interface Player {
  id: string;
  name: string;
  suspectId: string; // 負責的嫌疑犯 ID
  score: number;
  connected: boolean;
  agentId?: string;
  agentName?: string;
}

export interface Suspect {
  id: string;
  name: string;
  age: number;
  occupation: string;
  relationship: string; // 與死者的關係
  role: SuspectRole;
  systemPrompt: string; // AI 的角色指令
  assignedPlayerId: string; // 負責的偵探
}

export interface Clue {
  round: number;
  title: string;
  content: string;
}

export interface Script {
  id: string;
  // 案件背景
  setting: {
    location: string;
    era: string;
    time: string;
  };
  victim: {
    name: string;
    age: number;
    occupation: string;
    causeOfDeath: string;
    description: string; // 案件簡報
  };
  suspects: Suspect[];
  clues: Clue[];
  revealText: string; // 真相揭曉文本
}

export interface GameRoom {
  id: string;
  hostId: string;
  players: Player[];
  phase: GamePhase;
  currentRound: number;
  currentSubPhase: RoundSubPhase | null;
  script: Script | null;
  votes: Record<string, string>; // playerId -> suspectId
  tiebreakerCount: number;
  createdAt: string;
}

// ===== Chat Types =====

export type ChatRoom = "public" | "private" | "detective";

export interface ChatMessage {
  id: string;
  roomId: string;
  chatRoom: ChatRoom;
  senderId: string;
  senderName: string;
  senderType: "player" | "suspect" | "system";
  content: string;
  timestamp: string;
}

// ===== WebSocket Event Types =====

export type ClientEvent =
  | { type: "join_room"; roomId: string; playerName: string; accessToken?: string; agentId?: string }
  | { type: "start_game" }
  | { type: "send_message"; chatRoom: ChatRoom; content: string; targetSuspectId?: string }
  | { type: "vote"; suspectId: string }
  | { type: "ready_next_phase" };

export type ServerEvent =
  | { type: "room_state"; room: GameRoom }
  | { type: "player_joined"; player: Player }
  | { type: "player_left"; playerId: string }
  | { type: "phase_change"; phase: GamePhase; subPhase: RoundSubPhase | null; round: number }
  | { type: "clue_revealed"; clue: Clue }
  | { type: "chat_message"; message: ChatMessage }
  | { type: "suspect_speaking"; suspectId: string }
  | { type: "vote_cast"; playerId: string }
  | { type: "vote_result"; votes: Record<string, string>; eliminated: string | null; isTiebreaker: boolean }
  | { type: "game_reveal"; script: Script; scores: Record<string, number> }
  | { type: "error"; message: string };

// ===== Scoring =====

export interface ScoreResult {
  playerId: string;
  playerName: string;
  votedFor: string;
  correct: boolean;
  score: number;
  reason: string;
}

// ===== LLM Provider =====

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMProvider {
  chat(messages: LLMMessage[]): Promise<string>;
  name: string;
}

// ===== Constants =====

export const GAME_CONFIG = {
  MAX_PLAYERS: 3,
  MIN_PLAYERS: 3,
  TOTAL_ROUNDS: 3,
  SUSPECTS_PER_GAME: 3,
  KILLERS_PER_GAME: 1,

  // Timing (seconds)
  BRIEFING_DURATION: 60,
  TESTIMONY_DURATION: 90,
  INTERROGATION_DURATION: 120,
  PRIVATE_INTERROGATION_DURATION: 60,
  DETECTIVE_ROOM_DURATION: 90,
  FINAL_DEBATE_DURATION: 60,
  FINAL_MEETING_DURATION: 120,
  VOTING_DURATION: 30,
  TIEBREAKER_DEBATE_DURATION: 60,

  // Scoring
  SCORE_CORRECT_VOTE: 3,
  SCORE_KILLER_CAUGHT_BUT_WRONG_VOTE: 1,
  SCORE_KILLER_SURVIVED_OWNER: 2,
  SCORE_KILLER_SURVIVED_OTHERS: 0,
} as const;

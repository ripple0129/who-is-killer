import { nanoid } from "nanoid";
import type {
  GameRoom,
  GamePhase,
  RoundSubPhase,
  Player,
  ChatMessage,
  ScoreResult,
  Suspect,
  LLMMessage,
} from "@who-is-killer/shared/types";
import { GAME_CONFIG } from "@who-is-killer/shared/types";
import type { LLMProvider } from "../llm/index.js";
import { ScriptGenerator } from "./script-generator.js";

type EventCallback = (roomId: string, event: unknown) => void;

export class GameEngine {
  private rooms = new Map<string, GameRoom>();
  private chatHistories = new Map<string, ChatMessage[]>(); // roomId -> messages
  private suspectConversations = new Map<string, LLMMessage[]>(); // suspectId -> conversation history
  private scriptGenerator: ScriptGenerator;
  private llm: LLMProvider;
  private onEvent: EventCallback;
  private phaseTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(llm: LLMProvider, onEvent: EventCallback) {
    this.llm = llm;
    this.scriptGenerator = new ScriptGenerator(llm);
    this.onEvent = onEvent;
  }

  // ===== Room Management =====

  createRoom(hostName: string): { room: GameRoom; playerId: string } {
    const roomId = nanoid(8);
    const playerId = nanoid();
    const player: Player = {
      id: playerId,
      name: hostName,
      suspectId: "",
      score: 0,
      connected: true,
    };

    const room: GameRoom = {
      id: roomId,
      hostId: playerId,
      players: [player],
      phase: "lobby",
      currentRound: 0,
      currentSubPhase: null,
      script: null,
      votes: {},
      tiebreakerCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.rooms.set(roomId, room);
    this.chatHistories.set(roomId, []);
    return { room, playerId };
  }

  joinRoom(roomId: string, playerName: string): { room: GameRoom; playerId: string } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.phase !== "lobby") return null;
    if (room.players.length >= GAME_CONFIG.MAX_PLAYERS) return null;

    const playerId = nanoid();
    const player: Player = {
      id: playerId,
      name: playerName,
      suspectId: "",
      score: 0,
      connected: true,
    };

    room.players.push(player);
    this.emit(roomId, { type: "player_joined", player });
    return { room, playerId };
  }

  removePlayer(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== playerId);
    this.emit(roomId, { type: "player_left", playerId });

    if (room.players.length === 0) {
      this.clearTimer(roomId);
      this.rooms.delete(roomId);
      this.chatHistories.delete(roomId);
    }
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  // ===== Game Flow =====

  async startGame(roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.players.length !== GAME_CONFIG.MIN_PLAYERS) return false;
    if (room.phase !== "lobby") return false;

    // Generate script
    const script = await this.scriptGenerator.generate();

    // Randomly assign suspects to players
    const shuffledSuspects = [...script.suspects].sort(() => Math.random() - 0.5);
    room.players.forEach((player, i) => {
      player.suspectId = shuffledSuspects[i].id;
      shuffledSuspects[i].assignedPlayerId = player.id;
    });

    // Initialize conversation histories for each suspect
    for (const suspect of script.suspects) {
      this.suspectConversations.set(`${roomId}:${suspect.id}`, [
        { role: "system", content: suspect.systemPrompt },
      ]);
    }

    room.script = script;
    this.transitionTo(roomId, "briefing", null, 0);
    return true;
  }

  private transitionTo(
    roomId: string,
    phase: GamePhase,
    subPhase: RoundSubPhase | null,
    round: number,
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.phase = phase;
    room.currentSubPhase = subPhase;
    room.currentRound = round;

    this.emit(roomId, {
      type: "phase_change",
      phase,
      subPhase,
      round,
    });

    // Auto-advance logic
    this.clearTimer(roomId);

    switch (phase) {
      case "briefing":
        this.setTimer(roomId, GAME_CONFIG.BRIEFING_DURATION, () => {
          this.startRound(roomId, 1);
        });
        break;
      case "round":
        if (subPhase === "clue") {
          this.revealClue(roomId, round);
          // Auto advance to testimony after a short delay
          this.setTimer(roomId, 5, () => {
            this.transitionTo(roomId, "round", "testimony", round);
          });
        } else if (subPhase === "testimony") {
          this.generateTestimonies(roomId, round);
          this.setTimer(roomId, GAME_CONFIG.TESTIMONY_DURATION, () => {
            this.transitionTo(roomId, "round", "interrogation", round);
          });
        } else if (subPhase === "interrogation") {
          this.setTimer(roomId, GAME_CONFIG.INTERROGATION_DURATION, () => {
            this.transitionTo(roomId, "round", "private_interrogation", round);
          });
        } else if (subPhase === "private_interrogation") {
          this.setTimer(roomId, GAME_CONFIG.PRIVATE_INTERROGATION_DURATION, () => {
            this.transitionTo(roomId, "round", "detective_room", round);
          });
        } else if (subPhase === "detective_room") {
          this.setTimer(roomId, GAME_CONFIG.DETECTIVE_ROOM_DURATION, () => {
            if (round < GAME_CONFIG.TOTAL_ROUNDS) {
              this.startRound(roomId, round + 1);
            } else {
              this.transitionTo(roomId, "final_debate", null, round);
            }
          });
        }
        break;
      case "final_debate":
        this.generateFinalStatements(roomId);
        this.setTimer(roomId, GAME_CONFIG.FINAL_DEBATE_DURATION, () => {
          this.transitionTo(roomId, "final_meeting", null, round);
        });
        break;
      case "final_meeting":
        this.setTimer(roomId, GAME_CONFIG.FINAL_MEETING_DURATION, () => {
          this.transitionTo(roomId, "voting", null, round);
        });
        break;
      case "voting":
        room.votes = {};
        this.setTimer(roomId, GAME_CONFIG.VOTING_DURATION, () => {
          this.resolveVotes(roomId);
        });
        break;
      case "tiebreaker":
        room.votes = {};
        this.setTimer(roomId, GAME_CONFIG.TIEBREAKER_DEBATE_DURATION, () => {
          this.transitionTo(roomId, "voting", null, room.currentRound);
        });
        break;
    }
  }

  private startRound(roomId: string, round: number): void {
    this.transitionTo(roomId, "round", "clue", round);
  }

  private revealClue(roomId: string, round: number): void {
    const room = this.rooms.get(roomId);
    if (!room?.script) return;

    const clue = room.script.clues.find((c) => c.round === round);
    if (clue) {
      this.emit(roomId, { type: "clue_revealed", clue });
    }
  }

  private async generateTestimonies(roomId: string, round: number): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room?.script) return;

    for (const suspect of room.script.suspects) {
      this.emit(roomId, { type: "suspect_speaking", suspectId: suspect.id });

      const convKey = `${roomId}:${suspect.id}`;
      const history = this.suspectConversations.get(convKey) ?? [];

      const clue = room.script.clues.find((c) => c.round === round);
      const prompt = `現在是第 ${round} 回合。剛剛公布了一條新線索：「${clue?.content ?? ""}」\n\n請在公開審訊室中發表你的陳述。你可以解釋自己的行蹤、回應線索、或指出其他嫌疑犯的可疑之處。請用 2-4 句話回答，保持角色個性。`;

      history.push({ role: "user", content: prompt });

      const response = await this.llm.chat(history);
      history.push({ role: "assistant", content: response });

      this.suspectConversations.set(convKey, history);

      this.addChatMessage(roomId, "public", suspect.id, suspect.name, "suspect", response);
    }
  }

  private async generateFinalStatements(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room?.script) return;

    for (const suspect of room.script.suspects) {
      this.emit(roomId, { type: "suspect_speaking", suspectId: suspect.id });

      const convKey = `${roomId}:${suspect.id}`;
      const history = this.suspectConversations.get(convKey) ?? [];

      history.push({
        role: "user",
        content: "這是你的最後陳述機會。偵探們即將投票決定逮捕誰。請做出你最有說服力的最終辯護，2-4 句話。",
      });

      const response = await this.llm.chat(history);
      history.push({ role: "assistant", content: response });

      this.suspectConversations.set(convKey, history);
      this.addChatMessage(roomId, "public", suspect.id, suspect.name, "suspect", response);
    }
  }

  // ===== Chat =====

  async handlePlayerMessage(
    roomId: string,
    playerId: string,
    chatRoom: "public" | "private" | "detective",
    content: string,
    targetSuspectId?: string,
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room?.script) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    // Add player message
    this.addChatMessage(roomId, chatRoom, playerId, player.name, "player", content);

    // If it's a question in public or private, have the AI respond
    if (chatRoom === "public" && room.currentSubPhase === "interrogation") {
      // In public interrogation, player can ask any suspect
      // The target is determined by mentioning suspect name or @mention
      if (targetSuspectId) {
        await this.suspectRespond(roomId, targetSuspectId, content, "public");
      }
    } else if (chatRoom === "private" && room.currentSubPhase === "private_interrogation") {
      // In private, player talks to their own suspect
      await this.suspectRespond(roomId, player.suspectId, content, "private");
    }
    // detective room: no AI response, just player-to-player
  }

  private async suspectRespond(
    roomId: string,
    suspectId: string,
    question: string,
    chatRoom: "public" | "private",
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room?.script) return;

    const suspect = room.script.suspects.find((s) => s.id === suspectId);
    if (!suspect) return;

    const convKey = `${roomId}:${suspectId}`;
    const history = this.suspectConversations.get(convKey) ?? [];

    const context = chatRoom === "private" ? "（偵探正在私下審問你）" : "（偵探在公開審訊室質問你）";
    history.push({ role: "user", content: `${context}\n偵探問：${question}\n\n請以角色身份回答，1-3 句話。` });

    const response = await this.llm.chat(history);
    history.push({ role: "assistant", content: response });

    this.suspectConversations.set(convKey, history);
    this.addChatMessage(roomId, chatRoom, suspectId, suspect.name, "suspect", response);
  }

  private addChatMessage(
    roomId: string,
    chatRoom: "public" | "private" | "detective",
    senderId: string,
    senderName: string,
    senderType: "player" | "suspect" | "system",
    content: string,
  ): void {
    const message: ChatMessage = {
      id: nanoid(),
      roomId,
      chatRoom,
      senderId,
      senderName,
      senderType,
      content,
      timestamp: new Date().toISOString(),
    };

    const history = this.chatHistories.get(roomId) ?? [];
    history.push(message);
    this.chatHistories.set(roomId, history);

    this.emit(roomId, { type: "chat_message", message });
  }

  // ===== Voting =====

  castVote(roomId: string, playerId: string, suspectId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.phase !== "voting") return false;

    room.votes[playerId] = suspectId;
    this.emit(roomId, { type: "vote_cast", playerId });

    // Check if all votes are in
    if (Object.keys(room.votes).length === room.players.length) {
      this.clearTimer(roomId);
      this.resolveVotes(roomId);
    }
    return true;
  }

  private resolveVotes(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room?.script) return;

    // Count votes
    const voteCounts: Record<string, number> = {};
    for (const suspectId of Object.values(room.votes)) {
      voteCounts[suspectId] = (voteCounts[suspectId] ?? 0) + 1;
    }

    // Find max votes
    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const topSuspects = Object.entries(voteCounts).filter(([, count]) => count === maxVotes);

    // Tiebreaker check
    if (topSuspects.length > 1 && room.tiebreakerCount === 0) {
      room.tiebreakerCount++;
      this.emit(roomId, {
        type: "vote_result",
        votes: room.votes,
        eliminated: null,
        isTiebreaker: true,
      });
      this.transitionTo(roomId, "tiebreaker", null, room.currentRound);
      return;
    }

    // Determine eliminated (if still tie after tiebreaker, pick randomly)
    let eliminatedId: string;
    if (topSuspects.length > 1) {
      eliminatedId = topSuspects[Math.floor(Math.random() * topSuspects.length)][0];
    } else {
      eliminatedId = topSuspects[0][0];
    }

    this.emit(roomId, {
      type: "vote_result",
      votes: room.votes,
      eliminated: eliminatedId,
      isTiebreaker: false,
    });

    // Calculate scores
    const scores = this.calculateScores(room, eliminatedId);
    for (const result of scores) {
      const player = room.players.find((p) => p.id === result.playerId);
      if (player) player.score += result.score;
    }

    // Reveal
    this.emit(roomId, {
      type: "game_reveal",
      script: room.script,
      scores: Object.fromEntries(room.players.map((p) => [p.id, p.score])),
    });

    this.transitionTo(roomId, "reveal", null, room.currentRound);
  }

  private calculateScores(room: GameRoom, eliminatedId: string): ScoreResult[] {
    if (!room.script) return [];

    const killer = room.script.suspects.find((s) => s.role === "killer");
    if (!killer) return [];

    const killerCaught = eliminatedId === killer.id;

    return room.players.map((player) => {
      const votedFor = room.votes[player.id] ?? "";
      const votedCorrectly = votedFor === killer.id;
      const isKillerOwner = player.suspectId === killer.id;

      let score: number;
      let reason: string;

      if (killerCaught) {
        if (votedCorrectly) {
          score = GAME_CONFIG.SCORE_CORRECT_VOTE;
          reason = "投中兇手";
        } else {
          score = GAME_CONFIG.SCORE_KILLER_CAUGHT_BUT_WRONG_VOTE;
          reason = "兇手被逮捕但你投錯了";
        }
      } else {
        if (isKillerOwner) {
          score = GAME_CONFIG.SCORE_KILLER_SURVIVED_OWNER;
          reason = "你的嫌疑犯是兇手且存活了";
        } else {
          score = GAME_CONFIG.SCORE_KILLER_SURVIVED_OTHERS;
          reason = "兇手逃脫了";
        }
      }

      return {
        playerId: player.id,
        playerName: player.name,
        votedFor,
        correct: votedCorrectly,
        score,
        reason,
      };
    });
  }

  // ===== Utilities =====

  private emit(roomId: string, event: unknown): void {
    this.onEvent(roomId, event);
  }

  private setTimer(roomId: string, seconds: number, callback: () => void): void {
    this.clearTimer(roomId);
    this.phaseTimers.set(roomId, setTimeout(callback, seconds * 1000));
  }

  private clearTimer(roomId: string): void {
    const timer = this.phaseTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.phaseTimers.delete(roomId);
    }
  }

  getChatHistory(roomId: string, chatRoom?: string): ChatMessage[] {
    const all = this.chatHistories.get(roomId) ?? [];
    if (chatRoom) return all.filter((m) => m.chatRoom === chatRoom);
    return all;
  }
}

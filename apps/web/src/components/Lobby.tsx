"use client";

import { useGameStore } from "@/stores/game";
import { sendEvent } from "@/lib/ws";
import { GAME_CONFIG } from "@who-is-killer/shared/types";

export function Lobby() {
  const { room, playerId } = useGameStore();
  if (!room) return null;

  const isHost = room.hostId === playerId;
  const canStart = room.players.length === GAME_CONFIG.MIN_PLAYERS;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">等待偵探就位</h2>
          <div className="mt-2 inline-block rounded-full bg-[#1a1a1a] px-4 py-1 text-sm text-[#999]">
            房間代碼：<span className="font-mono text-white">{room.id}</span>
          </div>
        </div>

        {/* Player list */}
        <div className="space-y-3">
          {room.players.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-bold">
                {i + 1}
              </div>
              <span className="font-medium">{player.name}</span>
              {player.id === room.hostId && (
                <span className="ml-auto text-xs text-amber-500">房主</span>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: GAME_CONFIG.MAX_PLAYERS - room.players.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 rounded-lg border border-dashed border-[#333] px-4 py-3 text-[#666]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#333] text-sm">
                ?
              </div>
              <span>等待偵探加入...</span>
            </div>
          ))}
        </div>

        {/* Start button */}
        {isHost && (
          <button
            onClick={() => sendEvent({ type: "start_game" })}
            disabled={!canStart}
            className="w-full rounded-lg bg-red-600 px-6 py-4 text-lg font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {canStart ? "開始調查" : `需要 ${GAME_CONFIG.MIN_PLAYERS} 位偵探`}
          </button>
        )}

        {!isHost && (
          <p className="text-center text-[#999]">等待房主開始遊戲...</p>
        )}
      </div>
    </div>
  );
}

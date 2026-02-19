"use client";

import { useGameStore } from "@/stores/game";

export function Reveal() {
  const { revealedScript, scores, room, playerId } = useGameStore();

  if (!revealedScript || !scores || !room) return null;

  const killer = revealedScript.suspects.find((s) => s.role === "killer");
  const sortedPlayers = [...room.players].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-red-500">真相揭曉</p>
          <h2 className="mt-4 text-4xl font-bold">
            兇手是 <span className="text-red-500">{killer?.name}</span>
          </h2>
        </div>

        {/* Reveal text */}
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6">
          <p className="leading-relaxed whitespace-pre-line">{revealedScript.revealText}</p>
        </div>

        {/* All suspects revealed */}
        <div>
          <h3 className="mb-3 text-sm uppercase tracking-wider text-[#999]">嫌疑犯真相</h3>
          <div className="space-y-3">
            {revealedScript.suspects.map((s) => {
              const assignedPlayer = room.players.find((p) => p.suspectId === s.id);
              return (
                <div
                  key={s.id}
                  className={`rounded-lg border p-4 ${
                    s.role === "killer"
                      ? "border-red-500 bg-red-950/20"
                      : "border-[#333] bg-[#1a1a1a]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{s.role === "killer" ? "🔪" : "🎭"}</span>
                        <span className="font-semibold">{s.name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            s.role === "killer"
                              ? "bg-red-600 text-white"
                              : "bg-green-900 text-green-400"
                          }`}
                        >
                          {s.role === "killer" ? "兇手" : "無辜"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#999]">
                        {s.occupation} — {s.relationship}
                      </p>
                    </div>
                    {assignedPlayer && (
                      <span className="text-sm text-[#999]">
                        {assignedPlayer.name} 負責
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scores */}
        <div>
          <h3 className="mb-3 text-sm uppercase tracking-wider text-[#999]">計分板</h3>
          <div className="space-y-2">
            {sortedPlayers.map((player, i) => (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                  player.id === playerId
                    ? "border-blue-500 bg-blue-950/20"
                    : "border-[#333] bg-[#1a1a1a]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#999]">#{i + 1}</span>
                  <span className="font-medium">{player.name}</span>
                  {player.id === playerId && (
                    <span className="text-xs text-blue-400">你</span>
                  )}
                </div>
                <span className="text-xl font-bold text-amber-400">
                  {scores[player.id] ?? 0} 分
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Back to lobby */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block rounded-lg border border-[#333] px-8 py-3 transition hover:bg-[#1a1a1a]"
          >
            回到大廳
          </a>
        </div>
      </div>
    </div>
  );
}

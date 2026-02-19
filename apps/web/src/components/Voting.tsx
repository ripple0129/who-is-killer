"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/game";
import { sendEvent } from "@/lib/ws";

export function Voting() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const room = useGameStore((s) => s.room);

  if (!room?.script) return null;

  function handleVote() {
    if (!selected) return;
    sendEvent({ type: "vote", suspectId: selected });
    setHasVoted(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-red-500">投票逮捕</p>
          <h2 className="mt-2 text-3xl font-bold">你認為誰是兇手？</h2>
          {room.tiebreakerCount > 0 && (
            <p className="mt-2 text-amber-400">平票加賽 — 再投一次</p>
          )}
        </div>

        {hasVoted ? (
          <div className="text-center">
            <div className="mb-4 text-6xl">✅</div>
            <p className="text-xl">已投票</p>
            <p className="mt-2 text-[#999]">等待其他偵探投票...</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {room.script.suspects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    selected === s.id
                      ? "border-red-500 bg-red-950/30"
                      : "border-[#333] bg-[#1a1a1a] hover:border-[#555]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎭</span>
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-[#999]">
                        {s.occupation} — {s.relationship}
                      </p>
                    </div>
                    {selected === s.id && (
                      <span className="ml-auto text-red-500">●</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleVote}
              disabled={!selected}
              className="w-full rounded-lg bg-red-600 px-6 py-4 text-lg font-semibold transition hover:bg-red-700 disabled:opacity-30"
            >
              確認逮捕
            </button>
          </>
        )}
      </div>
    </div>
  );
}

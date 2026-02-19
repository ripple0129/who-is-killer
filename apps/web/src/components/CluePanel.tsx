"use client";

import { useGameStore } from "@/stores/game";

export function CluePanel() {
  const clues = useGameStore((s) => s.clues);
  const room = useGameStore((s) => s.room);
  const script = room?.script;

  return (
    <div className="flex h-full flex-col">
      {/* Suspects */}
      <div className="border-b border-[#333] p-4">
        <h3 className="mb-3 text-xs uppercase tracking-wider text-[#999]">嫌疑犯</h3>
        <div className="space-y-2">
          {script?.suspects.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded bg-[#242424] px-3 py-2">
              <span className="text-lg">🎭</span>
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-[#999]">{s.occupation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clues */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="mb-3 text-xs uppercase tracking-wider text-[#999]">線索</h3>
        {clues.length === 0 ? (
          <p className="text-sm text-[#666]">尚未公布線索</p>
        ) : (
          <div className="space-y-3">
            {clues.map((clue, i) => (
              <div key={i} className="rounded-lg border border-amber-900/30 bg-amber-950/10 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs text-amber-500">第 {clue.round} 回合</span>
                  <span className="text-xs font-medium text-amber-400">{clue.title}</span>
                </div>
                <p className="text-sm leading-relaxed">{clue.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Victim info */}
      {script && (
        <div className="border-t border-[#333] p-4">
          <h3 className="mb-2 text-xs uppercase tracking-wider text-red-400">死者</h3>
          <p className="text-sm font-medium">{script.victim.name}</p>
          <p className="text-xs text-[#999]">{script.victim.causeOfDeath}</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useGameStore } from "@/stores/game";

export function Briefing() {
  const room = useGameStore((s) => s.room);
  const script = room?.script;

  if (!script) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <p className="text-xl text-[#999]">劇本生成中...</p>
          <p className="mt-2 text-sm text-[#666]">AI 正在構建案件</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-red-500">案件簡報</p>
          <h2 className="mt-2 text-3xl font-bold">{script.setting.location}</h2>
          <p className="mt-1 text-[#999]">
            {script.setting.era} — {script.setting.time}
          </p>
        </div>

        {/* Victim */}
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6">
          <div className="mb-2 text-sm uppercase tracking-wider text-red-400">死者</div>
          <h3 className="text-xl font-bold">
            {script.victim.name}（{script.victim.age} 歲）
          </h3>
          <p className="text-[#999]">{script.victim.occupation}</p>
          <p className="mt-1 text-sm text-red-400">死因：{script.victim.causeOfDeath}</p>
        </div>

        {/* Description */}
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-6">
          <p className="leading-relaxed whitespace-pre-line">{script.victim.description}</p>
        </div>

        {/* Suspects preview */}
        <div>
          <p className="mb-3 text-sm uppercase tracking-wider text-[#999]">嫌疑犯</p>
          <div className="grid grid-cols-3 gap-3">
            {script.suspects.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4 text-center"
              >
                <div className="mb-2 text-2xl">🎭</div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-[#999]">{s.occupation}</p>
                <p className="mt-1 text-xs text-[#666]">{s.relationship}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-[#666]">調查即將開始...</p>
      </div>
    </div>
  );
}

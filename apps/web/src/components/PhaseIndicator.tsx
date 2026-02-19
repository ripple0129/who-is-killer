"use client";

import { useGameStore } from "@/stores/game";

const PHASE_LABELS: Record<string, string> = {
  briefing: "案件簡報",
  round: "調查回合",
  final_debate: "最終辯論",
  final_meeting: "偵探最終會議",
  voting: "投票逮捕",
  tiebreaker: "平票加賽",
  reveal: "真相揭曉",
};

const SUBPHASE_LABELS: Record<string, string> = {
  clue: "線索公布",
  testimony: "嫌疑犯供詞",
  interrogation: "公開質問",
  private_interrogation: "私人偵訊",
  detective_room: "偵探密室",
};

export function PhaseIndicator() {
  const room = useGameStore((s) => s.room);
  if (!room) return null;

  const phaseLabel = PHASE_LABELS[room.phase] ?? room.phase;
  const subPhaseLabel = room.currentSubPhase
    ? SUBPHASE_LABELS[room.currentSubPhase]
    : null;

  return (
    <div className="flex items-center gap-3">
      {room.phase === "round" && (
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((r) => (
            <div
              key={r}
              className={`h-2 w-8 rounded-full ${
                r <= room.currentRound ? "bg-red-500" : "bg-[#333]"
              }`}
            />
          ))}
        </div>
      )}
      <div>
        <span className="text-sm font-semibold text-red-400">{phaseLabel}</span>
        {subPhaseLabel && (
          <span className="ml-2 text-sm text-[#999]">— {subPhaseLabel}</span>
        )}
        {room.phase === "round" && (
          <span className="ml-2 text-xs text-[#666]">
            第 {room.currentRound}/3 回合
          </span>
        )}
      </div>
    </div>
  );
}

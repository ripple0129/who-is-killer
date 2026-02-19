"use client";

import { useGameStore } from "@/stores/game";
import { ChatPanel } from "./ChatPanel";
import { CluePanel } from "./CluePanel";
import { PhaseIndicator } from "./PhaseIndicator";

export function GameBoard() {
  const { room, activeTab, setActiveTab, playerId } = useGameStore();
  if (!room) return null;

  const currentPlayer = room.players.find((p) => p.id === playerId);
  const mySuspect = room.script?.suspects.find((s) => s.id === currentPlayer?.suspectId);

  const tabs = [
    { key: "public" as const, label: "審訊室", icon: "🏛️" },
    { key: "private" as const, label: "偵訊室", icon: "🔒" },
    { key: "detective" as const, label: "偵探密室", icon: "🕵️" },
  ];

  // Determine which tabs are active based on current phase
  const isPrivatePhase = room.currentSubPhase === "private_interrogation";
  const isDetectivePhase = room.currentSubPhase === "detective_room" || room.phase === "final_meeting";

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#333] bg-[#1a1a1a] px-4 py-3">
        <PhaseIndicator />
        {mySuspect && (
          <div className="flex items-center gap-2 text-sm text-[#999]">
            <span>你的嫌疑犯：</span>
            <span className="font-semibold text-white">{mySuspect.name}</span>
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Clue sidebar */}
        <div className="w-72 border-r border-[#333] bg-[#1a1a1a]">
          <CluePanel />
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          {/* Tab bar */}
          <div className="flex border-b border-[#333]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const isHighlighted =
                (tab.key === "private" && isPrivatePhase) ||
                (tab.key === "detective" && isDetectivePhase);

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border-b-2 border-red-500 text-white"
                      : isHighlighted
                        ? "text-amber-400 hover:text-amber-300"
                        : "text-[#999] hover:text-white"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {isHighlighted && !isActive && (
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Chat panel */}
          <ChatPanel chatRoom={activeTab} />
        </div>
      </div>
    </div>
  );
}

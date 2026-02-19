"use client";

import { useRef, useEffect, useState } from "react";
import { useGameStore } from "@/stores/game";
import { sendEvent } from "@/lib/ws";
import type { ChatRoom } from "@who-is-killer/shared/types";

interface ChatPanelProps {
  chatRoom: ChatRoom;
}

export function ChatPanel({ chatRoom }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [targetSuspect, setTargetSuspect] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, room, playerId } = useGameStore();

  const filteredMessages = messages.filter((m) => {
    if (chatRoom === "private") {
      // In private, only show messages between this player and their suspect
      const player = room?.players.find((p) => p.id === playerId);
      if (!player) return false;
      return (
        m.chatRoom === "private" &&
        (m.senderId === playerId || m.senderId === player.suspectId)
      );
    }
    return m.chatRoom === chatRoom;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages.length]);

  function handleSend() {
    if (!input.trim()) return;

    sendEvent({
      type: "send_message",
      chatRoom,
      content: input.trim(),
      targetSuspectId: chatRoom === "public" ? targetSuspect || undefined : undefined,
    });
    setInput("");
  }

  const canSend =
    (chatRoom === "public" && (room?.currentSubPhase === "interrogation" || room?.currentSubPhase === "testimony")) ||
    (chatRoom === "private" && room?.currentSubPhase === "private_interrogation") ||
    (chatRoom === "detective" && (room?.currentSubPhase === "detective_room" || room?.phase === "final_meeting" || room?.phase === "tiebreaker"));

  const placeholders: Record<string, string> = {
    public: "向嫌疑犯提問...",
    private: "私下審問你的嫌疑犯...",
    detective: "跟其他偵探討論...",
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[#666]">
              {chatRoom === "public" && "等待嫌疑犯發言..."}
              {chatRoom === "private" && "在這裡私下審問你的嫌疑犯"}
              {chatRoom === "detective" && "偵探專屬頻道 — AI 看不到"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => {
              const isMe = msg.senderId === playerId;
              const isSuspect = msg.senderType === "suspect";
              const isSystem = msg.senderType === "system";

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center text-sm text-[#666]">
                    {msg.content}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isMe
                        ? "bg-blue-600"
                        : isSuspect
                          ? "border border-[#333] bg-[#242424]"
                          : "bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      {isSuspect && <span className="text-xs">🎭</span>}
                      <span
                        className={`text-xs font-medium ${
                          isSuspect ? "text-amber-400" : "text-blue-400"
                        }`}
                      >
                        {msg.senderName}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[#333] p-4">
        {chatRoom === "public" && room?.currentSubPhase === "interrogation" && (
          <div className="mb-2 flex gap-2">
            {room.script?.suspects.map((s) => (
              <button
                key={s.id}
                onClick={() => setTargetSuspect(s.id)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  targetSuspect === s.id
                    ? "bg-red-600 text-white"
                    : "bg-[#242424] text-[#999] hover:text-white"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={canSend ? placeholders[chatRoom] : "目前無法發言"}
            disabled={!canSend}
            className="flex-1 rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-2 text-sm outline-none focus:border-red-500 disabled:opacity-30"
          />
          <button
            onClick={handleSend}
            disabled={!canSend || !input.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium transition hover:bg-red-700 disabled:opacity-30"
          >
            發送
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useGameStore } from "@/stores/game";
import { connectWebSocket, disconnectWebSocket } from "@/lib/ws";
import { Lobby } from "@/components/Lobby";
import { Briefing } from "@/components/Briefing";
import { GameBoard } from "@/components/GameBoard";
import { Voting } from "@/components/Voting";
import { Reveal } from "@/components/Reveal";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { room, playerName, isConnected } = useGameStore();

  useEffect(() => {
    if (playerName && roomId) {
      connectWebSocket(roomId, playerName);
    }
    return () => disconnectWebSocket();
  }, [roomId, playerName]);

  if (!playerName) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[#999]">請從首頁進入遊戲</p>
      </div>
    );
  }

  if (!isConnected || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">🔍</div>
          <p className="text-[#999]">連線中...</p>
        </div>
      </div>
    );
  }

  switch (room.phase) {
    case "lobby":
      return <Lobby />;
    case "briefing":
      return <Briefing />;
    case "round":
    case "final_debate":
    case "final_meeting":
    case "tiebreaker":
      return <GameBoard />;
    case "voting":
      return <Voting />;
    case "reveal":
      return <Reveal />;
    default:
      return null;
  }
}

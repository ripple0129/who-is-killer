"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useGameStore } from "@/stores/game";

export default function HomePage() {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setConnection = useGameStore((s) => s.setConnection);

  async function handleCreate() {
    if (!name.trim()) return setError("請輸入你的名字");
    setLoading(true);
    setError("");
    try {
      const { roomId, playerId } = await api.createRoom(name.trim());
      setConnection(roomId, playerId, name.trim());
      router.push(`/room/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "建立房間失敗");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim()) return setError("請輸入你的名字");
    if (!joinCode.trim()) return setError("請輸入房間代碼");
    setLoading(true);
    setError("");
    try {
      const { playerId } = await api.joinRoom(joinCode.trim(), name.trim());
      setConnection(joinCode.trim(), playerId, name.trim());
      router.push(`/room/${joinCode.trim()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加入房間失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-red-500">
            WHO IS KILLER
          </h1>
          <p className="mt-3 text-[#999]">AI 推理對決 — 找出兇手</p>
        </div>

        {mode === "menu" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              className="w-full rounded-lg bg-red-600 px-6 py-4 text-lg font-semibold transition hover:bg-red-700"
            >
              建立房間
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-6 py-4 text-lg font-semibold transition hover:bg-[#242424]"
            >
              加入房間
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="你的偵探代號"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-lg outline-none focus:border-red-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "建立中..." : "建立房間"}
            </button>
            <button
              onClick={() => { setMode("menu"); setError(""); }}
              className="w-full py-2 text-[#999] hover:text-white"
            >
              返回
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="你的偵探代號"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-lg outline-none focus:border-red-500"
            />
            <input
              type="text"
              placeholder="房間代碼"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-lg outline-none focus:border-red-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "加入中..." : "加入房間"}
            </button>
            <button
              onClick={() => { setMode("menu"); setError(""); }}
              className="w-full py-2 text-[#999] hover:text-white"
            >
              返回
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

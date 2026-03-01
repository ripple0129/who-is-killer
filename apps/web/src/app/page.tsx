"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useGameStore } from "@/stores/game";
import { ArinovaAuth } from "@/lib/arinova";

export default function HomePage() {
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setConnection = useGameStore((s) => s.setConnection);
  const arinovaUser = useGameStore((s) => s.arinovaUser);
  const accessToken = useGameStore((s) => s.accessToken);
  const agents = useGameStore((s) => s.agents);
  const selectedAgent = useGameStore((s) => s.selectedAgent);
  const setSelectedAgent = useGameStore((s) => s.setSelectedAgent);
  const logout = useGameStore((s) => s.logout);

  const playerName = arinovaUser?.name ?? "";

  async function handleCreate() {
    if (!accessToken || !selectedAgent) return;
    setLoading(true);
    setError("");
    try {
      const { roomId, playerId } = await api.createRoom(
        playerName,
        accessToken,
        selectedAgent.id,
        selectedAgent.name,
      );
      setConnection(roomId, playerId, playerName);
      router.push(`/room/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "建立房間失敗");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!accessToken || !selectedAgent) return;
    if (!joinCode.trim()) return setError("請輸入房間代碼");
    setLoading(true);
    setError("");
    try {
      const { playerId } = await api.joinRoom(
        joinCode.trim(),
        playerName,
        accessToken,
        selectedAgent.id,
        selectedAgent.name,
      );
      setConnection(joinCode.trim(), playerId, playerName);
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

        {/* Auth section */}
        {!arinovaUser ? (
          <button
            onClick={() => ArinovaAuth.login()}
            className="w-full rounded-lg bg-indigo-600 px-6 py-4 text-lg font-semibold transition hover:bg-indigo-700"
          >
            使用 Arinova 登入
          </button>
        ) : (
          <div className="space-y-4">
            {/* User info */}
            <div className="flex items-center justify-between rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3">
              <div className="flex items-center gap-3">
                {arinovaUser.image && (
                  <img src={arinovaUser.image} alt="" className="h-8 w-8 rounded-full" />
                )}
                <span className="font-medium">{arinovaUser.name}</span>
              </div>
              <button onClick={logout} className="text-sm text-[#999] hover:text-white">
                登出
              </button>
            </div>

            {/* Agent selection */}
            <div className="space-y-2">
              <p className="text-sm text-[#999]">選擇你的 AI 探員</p>
              {agents.length === 0 ? (
                <p className="text-sm text-amber-400">
                  你還沒有 AI Agent，請先到 Arinova 建立一個。
                </p>
              ) : (
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                        selectedAgent?.id === agent.id
                          ? "border-red-500 bg-red-500/10"
                          : "border-[#333] bg-[#1a1a1a] hover:border-[#555]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {agent.avatarUrl && (
                          <img src={agent.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
                        )}
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          {agent.description && (
                            <div className="text-sm text-[#999]">{agent.description}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Menu / Create / Join — only show when agent is selected */}
            {selectedAgent && (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

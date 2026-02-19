const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3601";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  createRoom: (playerName: string) =>
    request<{ roomId: string; playerId: string }>("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName }),
    }),

  getRoom: (roomId: string) =>
    request<{ id: string; players: unknown[] }>(`/api/rooms/${roomId}`),

  joinRoom: (roomId: string, playerName: string) =>
    request<{ playerId: string }>(`/api/rooms/${roomId}/join`, {
      method: "POST",
      body: JSON.stringify({ roomId, playerName }),
    }),
};

export const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3601") + "/ws";

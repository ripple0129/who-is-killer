const ARINOVA_BASE_URL =
  process.env.NEXT_PUBLIC_ARINOVA_URL || "http://192.168.68.83:21001";
const CLIENT_ID =
  process.env.NEXT_PUBLIC_ARINOVA_CLIENT_ID || "who-is-killer";

export interface ArinovaUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface ArinovaAgent {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
}

export const ArinovaAuth = {
  /** Redirect user to Arinova OAuth consent page */
  login() {
    const state = crypto.randomUUID();
    sessionStorage.setItem("arinova_oauth_state", state);
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: window.location.origin + "/callback",
      scope: "profile agents",
      state,
    });
    window.location.href = `${ARINOVA_BASE_URL}/oauth/authorize?${params}`;
  },

  /** Exchange authorization code for access token (via our own server) */
  async handleCallback(
    code: string,
  ): Promise<{ user: ArinovaUser; accessToken: string }> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3601";
    const res = await fetch(`${API_URL}/api/auth/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error("Auth failed");
    return res.json();
  },

  /** Fetch user's agents from Arinova API */
  async getAgents(accessToken: string): Promise<ArinovaAgent[]> {
    const res = await fetch(`${ARINOVA_BASE_URL}/api/v1/user/agents`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Failed to get agents");
    const data = await res.json();
    return data.agents;
  },
};

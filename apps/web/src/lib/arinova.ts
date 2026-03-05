import { Arinova } from "@arinova-ai/spaces-sdk";
import type { ArinovaUser, AgentInfo } from "@arinova-ai/spaces-sdk";

const ARINOVA_BASE_URL =
  process.env.NEXT_PUBLIC_ARINOVA_URL || "http://192.168.68.83:21001";
const CLIENT_ID =
  process.env.NEXT_PUBLIC_ARINOVA_CLIENT_ID || "who-is-killer";

Arinova.init({
  appId: CLIENT_ID,
  baseUrl: ARINOVA_BASE_URL,
});

export type { ArinovaUser, AgentInfo as ArinovaAgent };
export { Arinova };

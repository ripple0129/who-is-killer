import { z } from "zod";

// ===== Script Generation Schema =====

export const suspectSchema = z.object({
  name: z.string(),
  age: z.number(),
  occupation: z.string(),
  relationship: z.string(),
  role: z.enum(["innocent", "killer"]),
  trueWhereabouts: z.string(),
  hiddenSecret: z.string(),
  lieVersion: z.string().optional(), // 兇手的謊言版本
  motive: z.string().optional(), // 兇手的動機
  systemPrompt: z.string(),
});

export const clueSchema = z.object({
  round: z.number().min(1).max(3),
  title: z.string(),
  content: z.string(),
});

export const scriptSchema = z.object({
  setting: z.object({
    location: z.string(),
    era: z.string(),
    time: z.string(),
  }),
  victim: z.object({
    name: z.string(),
    age: z.number(),
    occupation: z.string(),
    causeOfDeath: z.string(),
    description: z.string(),
  }),
  suspects: z.array(suspectSchema).length(3),
  clues: z.array(clueSchema).length(3),
  revealText: z.string(),
});

export type ScriptInput = z.infer<typeof scriptSchema>;

// ===== Room Creation =====

export const createRoomSchema = z.object({
  playerName: z.string().min(1).max(20),
  accessToken: z.string().optional(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
});

export const joinRoomSchema = z.object({
  roomId: z.string().min(1),
  playerName: z.string().min(1).max(20),
  accessToken: z.string().optional(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
});

// ===== Vote =====

export const voteSchema = z.object({
  suspectId: z.string().min(1),
});

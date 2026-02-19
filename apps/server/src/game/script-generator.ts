import type { LLMProvider } from "../llm/index.js";
import type { Script, Suspect } from "@who-is-killer/shared/types";
import { scriptSchema } from "@who-is-killer/shared/schemas";
import { nanoid } from "nanoid";

const SCRIPT_GENERATION_PROMPT = `你是一個推理遊戲劇本生成器。請生成一個完整的謀殺案劇本，供 3 位偵探和 3 名嫌疑犯使用。

要求：
1. 案件背景要有趣且詳細
2. 3 名嫌疑犯中，恰好 1 名是兇手
3. 每個嫌疑犯都要有自己隱瞞的秘密（不管有沒有殺人）
4. 3 條線索要逐步引導推理，第 1 條最模糊，第 3 條最關鍵
5. 線索不能直接揭露兇手，但聰明的偵探能從中推理出真相
6. 每個嫌疑犯的 systemPrompt 要詳細指示 AI 如何扮演角色

回傳嚴格的 JSON 格式（不要包含 markdown code block）：
{
  "setting": {
    "location": "地點描述",
    "era": "時代",
    "time": "案發時間"
  },
  "victim": {
    "name": "死者姓名",
    "age": 數字,
    "occupation": "職業",
    "causeOfDeath": "死因",
    "description": "案件簡報（給偵探看的，2-3 段描述案件背景）"
  },
  "suspects": [
    {
      "name": "嫌疑犯姓名",
      "age": 數字,
      "occupation": "職業",
      "relationship": "與死者關係",
      "role": "innocent 或 killer",
      "trueWhereabouts": "真實行蹤",
      "hiddenSecret": "隱瞞的秘密",
      "lieVersion": "（僅兇手）謊言版本",
      "motive": "（僅兇手）犯案動機",
      "systemPrompt": "完整的 AI 角色指令，包含：身分背景、真實行蹤、該隱瞞什麼、回答風格、面對追問時的策略"
    }
  ],
  "clues": [
    {
      "round": 1,
      "title": "線索標題",
      "content": "線索內容"
    }
  ],
  "revealText": "真相揭曉的完整敘事文本"
}`;

const THEMES = [
  "豪華郵輪上的謀殺",
  "古宅家族聚會命案",
  "醫院深夜離奇死亡",
  "校園畢業典禮血案",
  "科技公司高層被殺",
  "五星級飯店客房命案",
  "山中露營地死亡事件",
  "藝術展覽開幕夜命案",
  "婚禮前夜的謀殺",
  "夜店 VIP 包廂血案",
  "寺廟住持離奇死亡",
  "列車上的密室殺人",
  "海邊別墅派對命案",
  "拍賣會上的死亡",
  "電影片場謀殺事件",
];

export class ScriptGenerator {
  constructor(private llm: LLMProvider) {}

  async generate(): Promise<Script> {
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];

    const response = await this.llm.chat([
      { role: "system", content: SCRIPT_GENERATION_PROMPT },
      { role: "user", content: `請以「${theme}」為主題生成劇本。` },
    ]);

    // Parse and validate
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const validated = scriptSchema.parse(parsed);

    // Map to Script type with IDs
    const scriptId = nanoid();
    const suspects: Suspect[] = validated.suspects.map((s, i) => ({
      id: `suspect-${i + 1}`,
      name: s.name,
      age: s.age,
      occupation: s.occupation,
      relationship: s.relationship,
      role: s.role,
      systemPrompt: s.systemPrompt,
      assignedPlayerId: "", // Will be assigned when game starts
    }));

    return {
      id: scriptId,
      setting: validated.setting,
      victim: validated.victim,
      suspects,
      clues: validated.clues,
      revealText: validated.revealText,
    };
  }
}

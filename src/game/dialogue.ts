import type { DialogueContext, DialogueLine, DialogueProvider, NpcProfile } from "./types";

/**
 * Scripted dialogue. Swap this for an LLM-backed provider later:
 *
 *   engine.setDialogueProvider(new LlmDialogueProvider("/api/npc-chat"))
 *
 * The provider only needs to implement `getGreeting`.
 */
export class ScriptedDialogueProvider implements DialogueProvider {
  getGreeting(npc: NpcProfile, ctx: DialogueContext): DialogueLine[] {
    const lines: DialogueLine[] = [
      {
        speaker: npc.name,
        text: greetByJob(npc, ctx),
      },
    ];
    if (ctx.wantedStars >= 2) {
      lines.push({
        speaker: npc.name,
        text: "你後面那幾輛警車……最好別在我旁邊久留。",
      });
    } else if (ctx.wantedStars >= 1) {
      lines.push({
        speaker: npc.name,
        text: "城南那邊好像在廣播通緝，最近開車小心點。",
      });
    } else {
      lines.push({
        speaker: npc.name,
        text: flavorByPersonality(npc, ctx),
      });
    }
    return lines;
  }
}

/**
 * Stub for a future large-language-model backend.
 * Keep the same signature so missions / HUD do not change.
 */
export class LlmDialogueProvider implements DialogueProvider {
  constructor(
    private readonly endpoint: string,
    private readonly fallback: DialogueProvider = new ScriptedDialogueProvider(),
  ) {}

  async getGreeting(npc: NpcProfile, ctx: DialogueContext): Promise<DialogueLine[]> {
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          npc: {
            name: npc.name,
            job: npc.job,
            personality: npc.personality,
            status: npc.status,
          },
          context: ctx,
        }),
      });
      if (!res.ok) throw new Error("llm http");
      const data = (await res.json()) as { lines?: DialogueLine[] };
      if (data.lines?.length) return data.lines;
    } catch {
      /* fall through to scripted lines */
    }
    return this.fallback.getGreeting(npc, ctx);
  }
}

function greetByJob(npc: NpcProfile, ctx: DialogueContext): string {
  switch (npc.id) {
    case "chen":
      return ctx.inVehicle
        ? "嘿，同行啊？潮港這點路，熟就好開。"
        : "要車嗎？我剛好要收工，不過短程還是可以載。";
    case "lin":
      return "今天海灣風有點大，店裡沒什麼客人。你要不要進去坐一下？";
    case "wang":
      return "請不要擋人行道。有事去城南警察局報案。";
    case "huang":
      return "抱歉我趕時間。東城那棟大樓的電梯總是在整修。";
    case "chang":
      return "這城市晚上意外地好逛。你是外地來的？";
    case "wu":
      return "如果頭暈或受傷，別硬撐，先找地方坐一下。";
    case "lee":
      return "西港那邊的管線又爆了，我正要過去。";
    case "chou":
      return "中央大道的招牌字體真的有夠亂。誰准他們用三種粗細的？";
    case "hsu":
      return "晚上新生公園旁邊人比較多，想吃鹽酥雞就那邊找我表弟。";
    case "tsai":
      return "請注意交通。潮港的肇事鑑定我接過太多次了。";
    case "passenger":
      return "……你是來接我的嗎？東城商業區，謝謝。";
    default:
      return `你好，我是${npc.name}，${npc.job}。`;
  }
}

function flavorByPersonality(npc: NpcProfile, ctx: DialogueContext): string {
  if (npc.personality.includes("急性子")) {
    return "別磨蹭，紅燈也別一直按喇叭，這邊警察記仇。";
  }
  if (npc.personality.includes("溫柔")) {
    return `最近${ctx.location}氣氛還不錯，慢慢逛就好。`;
  }
  if (npc.personality.includes("正經")) {
    return "保持車距，禮讓行人。這不是建議，是規定。";
  }
  if (npc.personality.includes("好奇")) {
    return "聽說港灣停車場晚上有人飆車。我只是聽說。";
  }
  if (npc.personality.includes("嘴毒")) {
    return "你那走路姿勢，很像剛從遊戲教學關卡走出來。";
  }
  return `我現在的狀態是：${npc.status}。`;
}

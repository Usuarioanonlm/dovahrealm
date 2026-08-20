// DovahRealm — NPCs: diálogos, lojas e entrega de quests
import { TILE, collideCircle, type WorldData } from "./world";
import type { GameState, Npc, NpcKind } from "./types";

let npcId = 1;

export interface DialogLine {
  speaker: string;
  text: string;
}

export interface DialogDef {
  id: string;
  lines: DialogLine[];
  questId?: string; // quest que pode ser aceita ao final
  shopId?: string; // loja que pode ser aberta ao final
}

export const DIALOGS: Record<string, DialogDef> = {
  elder: {
    id: "elder",
    lines: [
      { speaker: "Ancião Balgruuf", text: "O norte chama, e poucos respondem. Você tem o olhar de quem já viu o inverno por dentro." },
      { speaker: "Ancião Balgruuf", text: "Alduin, o Devorador de Mundos, despertou no Túmulo do Culto do Dragão, ao nordeste. Se ninguém o detiver, estas montanhas serão o túmulo de todos nós." },
      { speaker: "Ancião Balgruuf", text: "Primeiro, recupere a Pedra do Dragão na Ruína de Véu Sinistro. Ela revela o caminho até a besta. Vá, e que Talos guie sua lâmina." },
    ],
    questId: "main_dragon",
  },
  blacksmith: {
    id: "blacksmith",
    lines: [
      { speaker: "Ferreira Grelka", text: "Ferro bom não nasce, é arrancado do fogo. Precisa de aço ou veio só olhar?" },
      { speaker: "Ferreira Grelka", text: "Os lobos andam comendo minhas caravanas. Cinco deles mortos e eu pago bem — e talvez pare de rosnar para você." },
    ],
    questId: "wolf_hunt",
    shopId: "blacksmith",
  },
  merchant: {
    id: "merchant",
    lines: [
      { speaker: "Mercador Lucan", text: "Bem-vindo à Empório do Vale! Poções, bugigangas, tudo o que um aventureiro precisa." },
      { speaker: "Mercador Lucan", text: "Na verdade... bandidos roubaram minha Garra Dourada e levaram para o acampamento ao sul. Recupere-a e terei uma recompensa generosa." },
    ],
    questId: "golden_claw",
    shopId: "general",
  },
  mage: {
    id: "mage",
    lines: [
      { speaker: "Maga Sydra", text: "Sinta o ar — a magicka aqui canta como gelo quebrando. Posso vender tomos, se tiver disciplina para lê-los." },
      { speaker: "Maga Sydra", text: "Os draugr de Gelomargo caminham de novo. Silencie quatro deles e eu a recompensarei com conhecimento arcano." },
    ],
    questId: "frostmere",
    shopId: "magic",
  },
  guard: {
    id: "guard",
    lines: [
      { speaker: "Guarda Kjell", text: "Mantenha a lâmina embainhada dentro da vila e não teremos problemas." },
      { speaker: "Guarda Kjell", text: "Estradas perigosas esses dias. Lobos ao sul, bandidos no acampamento, e coisas piores nas ruínas." },
    ],
  },
  innkeeper: {
    id: "innkeeper",
    lines: [
      { speaker: "Estalajadeira Hulda", text: "Entre, aqueça os ossos. Hidromel quente e histórias de dragão — as duas coisas que não faltam por aqui." },
      { speaker: "Hulda", text: "Dizem que quem dorme na Cripta de Gelomargo acorda sem alma. Eu prefiro meus hóspedes pagantes e vivos, obrigada." },
    ],
  },
  bard: {
    id: "bard",
    lines: [
      { speaker: "Bardo Mikael", text: "♪ E o herói desceu da montanha, com fogo nas mãos e trovão na garganta... ♪" },
      { speaker: "Mikael", text: "Uma moeda pela canção? Não? Então ao menos morra heroicamente — rende ótimas baladas." },
    ],
  },
};

export interface ShopDef {
  id: string;
  name: string;
  stock: string[]; // item ids
}

export const SHOPS: Record<string, ShopDef> = {
  blacksmith: {
    id: "blacksmith",
    name: "Forja de Grelka",
    stock: ["iron_sword", "steel_sword", "orcish_axe", "iron_dagger", "hunting_bow", "fur_armor", "iron_armor", "steel_armor"],
  },
  general: {
    id: "general",
    name: "Empório do Vale",
    stock: ["potion_health", "potion_stamina", "bread", "torch", "hunting_bow", "iron_dagger"],
  },
  magic: {
    id: "magic",
    name: "Arcana de Sydra",
    stock: ["tome_fire", "tome_frost", "tome_heal", "potion_magicka", "soul_gem"],
  },
};

export function createNpcs(): Npc[] {
  const mk = (kind: NpcKind, name: string, tx: number, ty: number, dialogId: string, shopId?: string, questId?: string): Npc => ({
    id: npcId++,
    kind,
    name,
    x: tx * TILE + TILE / 2,
    y: ty * TILE + TILE / 2,
    dir: 0,
    dialogId,
    shopId,
    questId,
    wanderT: Math.random() * 3,
    homeX: tx * TILE + TILE / 2,
    homeY: ty * TILE + TILE / 2,
  });

  return [
    // Riofrio (48,62)
    mk("elder", "Ancião Balgruuf", 48, 60, "elder", undefined, "main_dragon"),
    mk("blacksmith", "Ferreira Grelka", 45, 63, "blacksmith", "blacksmith", "wolf_hunt"),
    mk("merchant", "Mercador Lucan", 51, 63, "merchant", "general", "golden_claw"),
    mk("innkeeper", "Estalajadeira Hulda", 46, 60, "innkeeper"),
    mk("bard", "Bardo Mikael", 50, 61, "bard"),
    mk("guard", "Guarda Kjell", 48, 64, "guard"),
    // Brumaval (30,40)
    mk("mage", "Maga Sydra", 30, 38, "mage", "magic", "frostmere"),
    mk("guard", "Guarda Sven", 32, 41, "guard"),
  ];
}

export function updateNpcs(state: GameState, world: WorldData, dt: number) {
  for (const n of state.npcs) {
    n.wanderT -= dt;
    if (n.wanderT <= 0) {
      n.wanderT = 2 + Math.random() * 4;
      n.dir = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
    }
    // vagar leve perto de casa
    const dvec = [
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
    ][n.dir];
    const hx = n.homeX - n.x;
    const hy = n.homeY - n.y;
    const homeDist = Math.hypot(hx, hy);
    let mx = 0;
    let my = 0;
    if (homeDist > 1.5 * TILE) {
      mx = (hx / homeDist) * 0.5;
      my = (hy / homeDist) * 0.5;
    } else if (Math.random() < 0.3) {
      mx = dvec.x * 0.35;
      my = dvec.y * 0.35;
    }
    if (mx !== 0 || my !== 0) {
      const res = collideCircle(world, n.x + mx * TILE * dt, n.y + my * TILE * dt, 12);
      n.x = res.x;
      n.y = res.y;
    }
  }
}

export function nearestNpc(state: GameState, range: number): Npc | null {
  const p = state.player;
  let best: Npc | null = null;
  let bestD = range;
  for (const n of state.npcs) {
    const d = Math.hypot(n.x - p.x, n.y - p.y);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

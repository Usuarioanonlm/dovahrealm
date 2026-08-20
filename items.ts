// DovahRealm — catálogo de itens, magias e definições de inimigos
import type { EnemyDef, EnemyKind, ItemDef, Spell, SpellId } from "./types";

export const ITEMS: Record<string, ItemDef> = {
  // Armas
  iron_sword: { id: "iron_sword", name: "Espada de Ferro", type: "weapon", desc: "Lâmina confiável de ferro nórdico.", price: 45, dmg: 8, icon: "sword_iron" },
  steel_sword: { id: "steel_sword", name: "Espada de Aço", type: "weapon", desc: "Aço temperado em fogo de forja de vila.", price: 140, dmg: 14, icon: "sword_steel" },
  orcish_axe: { id: "orcish_axe", name: "Machado Orc", type: "weapon", desc: "Pesado, brutal, verde-acinzentado.", price: 260, dmg: 20, icon: "axe" },
  dragonblade: { id: "dragonblade", name: "Lâmina do Dragão", type: "weapon", desc: "Forjada com escama de dragão. Canta ao cortar.", price: 900, dmg: 32, icon: "sword_dragon" },
  hunting_bow: { id: "hunting_bow", name: "Arco de Caça", type: "weapon", desc: "Arco leve de pinho. Flechas infinitas.", price: 80, dmg: 7, icon: "bow" },
  iron_dagger: { id: "iron_dagger", name: "Adaga de Ferro", type: "weapon", desc: "Rápida e silenciosa.", price: 25, dmg: 5, icon: "dagger" },

  // Armaduras
  fur_armor: { id: "fur_armor", name: "Armadura de Pelo", type: "armor", desc: "Quente contra o vento do norte.", price: 60, armor: 3, icon: "armor_fur" },
  iron_armor: { id: "iron_armor", name: "Armadura de Ferro", type: "armor", desc: "Placas pesadas de ferro.", price: 180, armor: 7, icon: "armor_iron" },
  steel_armor: { id: "steel_armor", name: "Armadura de Aço", type: "armor", desc: "Brilha como gelo ao sol.", price: 420, armor: 12, icon: "armor_steel" },
  dragonscale: { id: "dragonscale", name: "Escama de Dragão", type: "armor", desc: "Armadura lendária feita do próprio Alduin.", price: 1500, armor: 20, icon: "armor_dragon" },

  // Poções
  potion_health: { id: "potion_health", name: "Poção de Cura", type: "potion", desc: "Restaura 40 de vida.", price: 30, heal: 40, icon: "potion_red" },
  potion_magicka: { id: "potion_magicka", name: "Poção de Magicka", type: "potion", desc: "Restaura 40 de magicka.", price: 30, magicka: 40, icon: "potion_blue" },
  potion_stamina: { id: "potion_stamina", name: "Poção de Vigor", type: "potion", desc: "Restaura 40 de stamina.", price: 25, stamina: 40, icon: "potion_green" },

  // Tomos
  tome_fire: { id: "tome_fire", name: "Tomo: Flecha de Fogo", type: "tome", desc: "Ensina a magia Flecha de Fogo.", price: 120, spell: "fire", icon: "tome_fire" },
  tome_frost: { id: "tome_frost", name: "Tomo: Espinho de Gelo", type: "tome", desc: "Ensina a magia Espinho de Gelo.", price: 120, spell: "frost", icon: "tome_frost" },
  tome_heal: { id: "tome_heal", name: "Tomo: Cura Menor", type: "tome", desc: "Ensina a magia Cura Menor.", price: 100, spell: "heal", icon: "tome_heal" },

  // Quest
  golden_claw: { id: "golden_claw", name: "Garra Dourada", type: "quest", desc: "Artefato antigo roubado das ruínas.", price: 0, icon: "claw" },
  dragon_stone: { id: "dragon_stone", name: "Pedra do Dragão", type: "quest", desc: "Mapa de pedra para o túmulo de Alduin.", price: 0, icon: "stone" },

  // Misc
  soul_gem: { id: "soul_gem", name: "Gema de Alma", type: "misc", desc: "Pulsa com uma luz violeta inquieta.", price: 80, icon: "gem" },
  iron_ore: { id: "iron_ore", name: "Minério de Ferro", type: "misc", desc: "Bruto, pesado, valioso para ferreiros.", price: 15, icon: "ore" },
  wolf_pelt: { id: "wolf_pelt", name: "Pele de Lobo", type: "misc", desc: "Espessa e quente.", price: 12, icon: "pelt" },
  bread: { id: "bread", name: "Pão de Centeio", type: "potion", desc: "Restaura 10 de vida. Cheiro de lar.", price: 5, heal: 10, icon: "bread" },
  torch: { id: "torch", name: "Tocha", type: "misc", desc: "Luz contra a longa noite.", price: 8, icon: "torch" },
};

export const SPELLS: Record<SpellId, Spell> = {
  fire: { id: "fire", name: "Flecha de Fogo", cost: 12, dmg: 16, speed: 340, color: "#ff7a2f", desc: "Projétil flamejante que explode no alvo." },
  frost: { id: "frost", name: "Espinho de Gelo", cost: 10, dmg: 12, speed: 420, color: "#7fd4e8", desc: "Lasca de gelo perfurante, mais rápida." },
  heal: { id: "heal", name: "Cura Menor", cost: 18, heal: 30, speed: 0, color: "#8fe89a", desc: "Fecha feridas com luz dourada." },
};

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  wolf: { kind: "wolf", name: "Lobo Cinzento", hp: 30, dmg: 6, speed: 2.6, aggroRange: 6, xp: 18, gold: [0, 4], scale: 1 },
  bandit: { kind: "bandit", name: "Bandido", hp: 45, dmg: 9, speed: 2.2, aggroRange: 7, xp: 30, gold: [8, 25], scale: 1 },
  draugr: { kind: "draugr", name: "Draugr", hp: 65, dmg: 12, speed: 1.6, aggroRange: 6, xp: 45, gold: [5, 18], scale: 1.05 },
  spider: { kind: "spider", name: "Aranha do Gelo", hp: 38, dmg: 8, speed: 2.9, aggroRange: 6, xp: 28, gold: [0, 6], scale: 0.95 },
  wraith: { kind: "wraith", name: "Espectro de Gelo", hp: 55, dmg: 11, speed: 2.4, aggroRange: 8, xp: 55, gold: [10, 20], scale: 1, ranged: true },
  dragon: { kind: "dragon", name: "Alduin, o Devorador", hp: 600, dmg: 24, speed: 2.0, aggroRange: 14, xp: 1000, gold: [300, 500], scale: 3.4, ranged: true },
};

export const LOOT_TABLE: Partial<Record<EnemyKind, { itemId: string; chance: number; qty: [number, number] }[]>> = {
  wolf: [{ itemId: "wolf_pelt", chance: 0.9, qty: [1, 2] }],
  bandit: [
    { itemId: "potion_health", chance: 0.35, qty: [1, 1] },
    { itemId: "iron_dagger", chance: 0.15, qty: [1, 1] },
  ],
  draugr: [
    { itemId: "soul_gem", chance: 0.4, qty: [1, 1] },
    { itemId: "iron_ore", chance: 0.5, qty: [1, 2] },
  ],
  spider: [{ itemId: "potion_stamina", chance: 0.25, qty: [1, 1] }],
  wraith: [
    { itemId: "soul_gem", chance: 0.7, qty: [1, 2] },
    { itemId: "tome_frost", chance: 0.12, qty: [1, 1] },
  ],
  dragon: [
    { itemId: "dragonscale", chance: 1, qty: [1, 1] },
    { itemId: "dragonblade", chance: 1, qty: [1, 1] },
  ],
};

export function xpForLevel(level: number): number {
  return Math.round(80 * Math.pow(level, 1.45));
}

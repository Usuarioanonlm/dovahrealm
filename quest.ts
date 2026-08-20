// DovahRealm — definições de quests (principal + secundárias)
import type { Quest } from "./types";

export function createQuests(): Quest[] {
  return [
    {
      id: "main_dragon",
      name: "O Devorador de Mundos",
      giver: "Ancião Balgruuf",
      desc: "Alduin, o dragão ancestral, despertou no Túmulo do Culto do Dragão. Recupere a Pedra do Dragão na Ruína de Véu Sinistro e destrua a besta antes que o norte inteiro queime.",
      objectives: [
        { text: "Fale com o Ancião Balgruuf em Riofrio", done: true },
        { text: "Recupere a Pedra do Dragão na Ruína de Véu Sinistro", itemId: "dragon_stone", done: false },
        { text: "Viaje ao Túmulo do Culto do Dragão", locationId: "dragoncult", done: false },
        { text: "Derrote Alduin", targetKind: "dragon", targetCount: 1, count: 0, done: false },
      ],
      rewardGold: 500,
      rewardXp: 800,
      rewardItemId: "dragonscale",
      state: "available",
      isMain: true,
    },
    {
      id: "wolf_hunt",
      name: "Praga de Lobos",
      giver: "Ferreira Grelka",
      desc: "As matilhas de lobos estão atacando as caravanas na estrada. Abata 5 lobos para tornar as rotas seguras de novo.",
      objectives: [{ text: "Abata lobos", targetKind: "wolf", targetCount: 5, count: 0, done: false }],
      rewardGold: 90,
      rewardXp: 120,
      state: "available",
    },
    {
      id: "golden_claw",
      name: "A Garra Roubada",
      giver: "Mercador Lucan",
      desc: "Bandidos roubaram a Garra Dourada da minha loja e se esconderam no acampamento ao sul. Traga-a de volta e pagarei bem.",
      objectives: [{ text: "Recupere a Garra Dourada no acampamento de bandidos", itemId: "golden_claw", done: false }],
      rewardGold: 150,
      rewardXp: 160,
      state: "available",
    },
    {
      id: "frostmere",
      name: "Sussurros em Gelomargo",
      giver: "Maga Sydra",
      desc: "Os draugr da Cripta de Gelomargo caminham de novo. Silencie 4 deles antes que alcancem a estrada.",
      objectives: [{ text: "Destrua draugr em Gelomargo", targetKind: "draugr", targetCount: 4, count: 0, done: false }],
      rewardGold: 180,
      rewardXp: 220,
      rewardItemId: "tome_frost",
      state: "available",
    },
  ];
}

export function questById(quests: Quest[], id: string): Quest | undefined {
  return quests.find((q) => q.id === id);
}


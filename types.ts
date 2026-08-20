// DovahRealm — tipos centrais do estado do jogo
// Design: Grimório Nórdico Iluminado — mundo frio, UI quente (ver ideas.md)

export type Dir = 0 | 1 | 2 | 3; // 0=baixo 1=esq 2=dir 3=cima

export interface Vec {
  x: number;
  y: number;
}

export type TileType =
  | "snow" // neve fofa (andável)
  | "grass" // planície fria (andável)
  | "forest" // pinheiro (sólido)
  | "deadtree" // árvore morta (sólido)
  | "rock" // pedra/montanha (sólido)
  | "water" // água profunda (sólido)
  | "ice" // rio congelado (andável)
  | "path" // trilha de terra (andável)
  | "floor" // piso de pedra de vila/ruína (andável)
  | "wall" // parede de pedra (sólido)
  | "bridge" // ponte (andável)
  | "door"; // entrada de local (andável, teleporta)

export interface Location {
  id: string;
  name: string;
  x: number; // tile
  y: number;
  kind: "village" | "ruin" | "cave" | "shrine" | "camp";
  discovered: boolean;
}

export type EnemyKind =
  | "wolf"
  | "bandit"
  | "draugr"
  | "spider"
  | "wraith"
  | "dragon";

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  hp: number;
  dmg: number;
  speed: number; // tiles/s
  aggroRange: number; // tiles
  xp: number;
  gold: [number, number]; // min,max
  scale: number; // render scale
  ranged?: boolean;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number; // world px
  y: number;
  hp: number;
  maxHp: number;
  dir: Dir;
  state: "idle" | "patrol" | "chase" | "attack" | "dead";
  stateT: number; // tempo no estado
  attackCd: number;
  hitFlash: number;
  homeX: number;
  homeY: number;
  walkFrame: number;
  dead: boolean;
  looted: boolean;
}

export type NpcKind =
  | "elder"
  | "blacksmith"
  | "merchant"
  | "guard"
  | "mage"
  | "innkeeper"
  | "bard";

export interface Npc {
  id: number;
  kind: NpcKind;
  name: string;
  x: number;
  y: number;
  dir: Dir;
  dialogId: string;
  shopId?: string;
  questId?: string;
  wanderT: number;
  homeX: number;
  homeY: number;
}

export type ItemType =
  | "weapon"
  | "armor"
  | "potion"
  | "tome"
  | "quest"
  | "misc";

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  desc: string;
  price: number;
  dmg?: number; // arma
  armor?: number; // armadura
  heal?: number; // poção vida
  magicka?: number; // poção magicka
  stamina?: number;
  spell?: SpellId; // tomo ensina magia
  icon: string; // chave do ícone desenhado
}

export interface InvSlot {
  itemId: string;
  qty: number;
}

export type SpellId = "fire" | "frost" | "heal";

export interface Spell {
  id: SpellId;
  name: string;
  cost: number;
  dmg?: number;
  heal?: number;
  speed: number; // projétil px/s
  color: string;
  desc: string;
}

export interface QuestObjective {
  text: string;
  targetKind?: EnemyKind;
  targetCount?: number;
  count?: number;
  itemId?: string;
  locationId?: string;
  done: boolean;
}

export interface Quest {
  id: string;
  name: string;
  giver: string;
  desc: string;
  objectives: QuestObjective[];
  rewardGold: number;
  rewardXp: number;
  rewardItemId?: string;
  state: "available" | "active" | "done" | "turned";
  isMain?: boolean;
}

export interface Player {
  x: number;
  y: number;
  dir: Dir;
  moving: boolean;
  walkFrame: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  sp: number; // stamina
  maxSp: number;
  level: number;
  xp: number;
  xpNext: number;
  gold: number;
  attackCd: number;
  castCd: number;
  shoutCd: number;
  hitFlash: number;
  invuln: number;
  weaponId: string | null;
  armorId: string | null;
  spell: SpellId;
  spells: SpellId[];
  inventory: InvSlot[];
  dead: boolean;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: "fire" | "frost" | "arrow" | "dragonfire";
  dmg: number;
  fromPlayer: boolean;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity?: number;
  glow?: boolean;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface Toast {
  text: string;
  sub?: string;
  t: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  npcs: Npc[];
  quests: Quest[];
  locations: Location[];
  timeOfDay: number; // 0..1 (0=meia-noite)
  day: number;
  projectiles: Projectile[];
  particles: Particle[];
  floats: FloatText[];
  toasts: Toast[];
  kills: Partial<Record<EnemyKind, number>>;
  dragonDefeated: boolean;
}

export type UiEvent =
  | { type: "openMenu"; menu: "inventory" | "map" | "quests" | "character" }
  | { type: "openDialog"; npcId: number }
  | { type: "openShop"; npcId: number }
  | { type: "gameOver" }
  | { type: "victory" };

export type UiEventHandler = (e: UiEvent) => void;

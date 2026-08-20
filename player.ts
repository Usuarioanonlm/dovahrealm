// DovahRealm — jogador: stats, movimento, combate melee/arco, magia, shout, XP/níveis
import { ITEMS, SPELLS, xpForLevel } from "./items";
import { TILE, collideCircle, type WorldData } from "./world";
import { addFloat, addToast, spawnBurst } from "./effects";
import type { GameState, Player, SpellId } from "./types";

export function createPlayer(x: number, y: number): Player {
  return {
    x,
    y,
    dir: 0,
    moving: false,
    walkFrame: 0,
    hp: 100,
    maxHp: 100,
    mp: 60,
    maxMp: 60,
    sp: 80,
    maxSp: 80,
    level: 1,
    xp: 0,
    xpNext: xpForLevel(1),
    gold: 25,
    attackCd: 0,
    castCd: 0,
    shoutCd: 0,
    hitFlash: 0,
    invuln: 0,
    weaponId: "iron_sword",
    armorId: "fur_armor",
    spell: "fire",
    spells: ["fire"],
    inventory: [
      { itemId: "iron_sword", qty: 1 },
      { itemId: "fur_armor", qty: 1 },
      { itemId: "potion_health", qty: 3 },
      { itemId: "bread", qty: 2 },
      { itemId: "hunting_bow", qty: 1 },
    ],
    dead: false,
  };
}

export function weaponDmg(p: Player): number {
  const base = p.weaponId ? (ITEMS[p.weaponId]?.dmg ?? 4) : 4;
  return base + Math.floor(p.level * 1.5);
}

export function armorValue(p: Player): number {
  return p.armorId ? (ITEMS[p.armorId]?.armor ?? 0) : 0;
}

export function addItem(p: Player, itemId: string, qty: number) {
  const slot = p.inventory.find((s) => s.itemId === itemId);
  if (slot) slot.qty += qty;
  else p.inventory.push({ itemId, qty });
}

export function removeItem(p: Player, itemId: string, qty: number): boolean {
  const i = p.inventory.findIndex((s) => s.itemId === itemId);
  if (i < 0) return false;
  const slot = p.inventory[i];
  if (slot.qty < qty) return false;
  slot.qty -= qty;
  if (slot.qty <= 0) {
    if (p.weaponId === itemId) p.weaponId = null;
    if (p.armorId === itemId) p.armorId = null;
    p.inventory.splice(i, 1);
  }
  return true;
}

export function countItem(p: Player, itemId: string): number {
  return p.inventory.find((s) => s.itemId === itemId)?.qty ?? 0;
}

export function gainXp(state: GameState, amount: number) {
  const p = state.player;
  p.xp += amount;
  addFloat(state.floats, p.x, p.y - 40, `+${amount} XP`, "#b08d3f");
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = xpForLevel(p.level);
    p.maxHp += 12;
    p.maxMp += 6;
    p.maxSp += 6;
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    p.sp = p.maxSp;
    addToast(state.toasts, `Nível ${p.level} alcançado!`, "Vida, magicka e stamina restauradas");
    spawnBurst(state.particles, p.x, p.y - 10, "#b08d3f", 40, 160, true);
  }
}

const SPEED = 3.4 * TILE; // px/s

export function updatePlayer(state: GameState, world: WorldData, dt: number, input: { x: number; y: number; sprint?: boolean }) {
  const p = state.player;
  if (p.dead) return;

  p.attackCd = Math.max(0, p.attackCd - dt);
  p.castCd = Math.max(0, p.castCd - dt);
  p.shoutCd = Math.max(0, p.shoutCd - dt);
  p.hitFlash = Math.max(0, p.hitFlash - dt);
  p.invuln = Math.max(0, p.invuln - dt);

  // regeneração suave
  p.mp = Math.min(p.maxMp, p.mp + 2.2 * dt);
  p.sp = Math.min(p.maxSp, p.sp + 6 * dt);

  const len = Math.hypot(input.x, input.y);
  p.moving = len > 0.15;
  if (p.moving) {
    const nx = input.x / Math.max(1, len);
    const ny = input.y / Math.max(1, len);
    const sprint = input.sprint && p.sp > 1;
    const spd = SPEED * (sprint ? 1.5 : 1);
    if (sprint) p.sp = Math.max(0, p.sp - 14 * dt);
    let px = p.x + nx * spd * dt;
    let py = p.y + ny * spd * dt;
    const res = collideCircle(world, px, py, 14);
    p.x = res.x;
    p.y = res.y;
    if (Math.abs(nx) > Math.abs(ny)) p.dir = nx < 0 ? 1 : 2;
    else p.dir = ny < 0 ? 3 : 0;
    p.walkFrame += dt * (sprint ? 12 : 8);
  } else {
    p.walkFrame = 0;
  }
}

export interface CombatCtx {
  damageEnemy: (id: number, dmg: number, kx: number, ky: number) => void;
  enemiesInArc: (x: number, y: number, dir: number, range: number, arc: number) => number[];
  fireProjectile: (kind: "fire" | "frost" | "arrow", x: number, y: number, tx: number, ty: number, dmg: number) => void;
  nearestEnemy: (x: number, y: number, range: number) => { id: number; x: number; y: number } | null;
}

export function playerAttack(state: GameState, ctx: CombatCtx) {
  const p = state.player;
  if (p.dead || p.attackCd > 0) return;
  const isBow = p.weaponId === "hunting_bow";
  p.attackCd = isBow ? 0.55 : 0.42;
  if (isBow) {
    // mira no inimigo mais próximo ou na direção do olhar
    const t = ctx.nearestEnemy(p.x, p.y, 9 * TILE);
    const dvec = dirVec(p.dir);
    ctx.fireProjectile("arrow", p.x, p.y - 8, t ? t.x : p.x + dvec.x * 300, t ? t.y : p.y + dvec.y * 300, weaponDmg(p));
  } else {
    const dvec = dirVec(p.dir);
    const ids = ctx.enemiesInArc(p.x, p.y, p.dir, 1.6 * TILE, Math.PI * 0.9);
    for (const id of ids) ctx.damageEnemy(id, weaponDmg(p), dvec.x * 140, dvec.y * 140);
    spawnBurst(state.particles, p.x + dvec.x * 30, p.y + dvec.y * 30 - 8, "#dfe8ee", 6, 90);
  }
}

export function playerCast(state: GameState, ctx: CombatCtx) {
  const p = state.player;
  if (p.dead || p.castCd > 0) return;
  const spell = SPELLS[p.spell];
  if (p.mp < spell.cost) {
    addFloat(state.floats, p.x, p.y - 40, "Sem magicka!", "#7fd4e8");
    return;
  }
  p.mp -= spell.cost;
  p.castCd = 0.5;
  if (spell.id === "heal") {
    p.hp = Math.min(p.maxHp, p.hp + (spell.heal ?? 0));
    spawnBurst(state.particles, p.x, p.y - 10, spell.color, 24, 90, true);
    addFloat(state.floats, p.x, p.y - 40, `+${spell.heal}`, "#8fe89a");
  } else {
    const t = ctx.nearestEnemy(p.x, p.y, 10 * TILE);
    const dvec = dirVec(p.dir);
    ctx.fireProjectile(spell.id, p.x, p.y - 8, t ? t.x : p.x + dvec.x * 400, t ? t.y : p.y + dvec.y * 400, (spell.dmg ?? 10) + p.level);
  }
}

export function playerShout(state: GameState, ctx: CombatCtx) {
  const p = state.player;
  if (p.dead || p.shoutCd > 0) return;
  p.shoutCd = 8;
  // FUS RO DAH: cone de empurrão + dano
  const dvec = dirVec(p.dir);
  const ids = ctx.enemiesInArc(p.x, p.y, p.dir, 3.2 * TILE, Math.PI * 0.7);
  for (const id of ids) ctx.damageEnemy(id, 20 + p.level * 2, dvec.x * 520, dvec.y * 520);
  for (let i = 0; i < 30; i++) {
    const spread = (Math.random() - 0.5) * 0.9;
    const a = Math.atan2(dvec.y, dvec.x) + spread;
    state.particles.push({
      x: p.x,
      y: p.y - 8,
      vx: Math.cos(a) * (200 + Math.random() * 260),
      vy: Math.sin(a) * (200 + Math.random() * 260),
      life: 0.5,
      maxLife: 0.5,
      size: 3 + Math.random() * 4,
      color: "#a8d8e8",
      glow: true,
    });
  }
  addFloat(state.floats, p.x, p.y - 46, "FUS RO DAH!", "#a8d8e8");
}

export function damagePlayer(state: GameState, rawDmg: number) {
  const p = state.player;
  if (p.dead || p.invuln > 0) return;
  const dmg = Math.max(1, Math.round(rawDmg - armorValue(p) * 0.6));
  p.hp -= dmg;
  p.hitFlash = 0.25;
  p.invuln = 0.35;
  addFloat(state.floats, p.x, p.y - 40, `-${dmg}`, "#e83a3a");
  spawnBurst(state.particles, p.x, p.y - 10, "#8e2f22", 10, 110);
  if (p.hp <= 0) {
    p.hp = 0;
    p.dead = true;
  }
}

export function dirVec(dir: number): { x: number; y: number } {
  switch (dir) {
    case 1:
      return { x: -1, y: 0 };
    case 2:
      return { x: 1, y: 0 };
    case 3:
      return { x: 0, y: -1 };
    default:
      return { x: 0, y: 1 };
  }
}

export function learnSpell(p: Player, spell: SpellId): boolean {
  if (p.spells.includes(spell)) return false;
  p.spells.push(spell);
  return true;
}

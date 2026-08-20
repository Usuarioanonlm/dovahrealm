// DovahRealm — IA dos inimigos: patrulha, perseguição, ataque, morte e loot
import { ENEMIES, LOOT_TABLE } from "./items";
import { TILE, collideCircle, type WorldData } from "./world";
import { addFloat, addToast, spawnBurst } from "./effects";
import { addItem, damagePlayer, gainXp } from "./player";
import type { Enemy, EnemyKind, GameState } from "./types";

let nextId = 1;

export function spawnEnemy(kind: EnemyKind, tx: number, ty: number): Enemy {
  const def = ENEMIES[kind];
  return {
    id: nextId++,
    kind,
    x: tx * TILE + TILE / 2,
    y: ty * TILE + TILE / 2,
    hp: def.hp,
    maxHp: def.hp,
    dir: 0,
    state: "idle",
    stateT: Math.random() * 2,
    attackCd: 0,
    hitFlash: 0,
    homeX: tx * TILE + TILE / 2,
    homeY: ty * TILE + TILE / 2,
    walkFrame: 0,
    dead: false,
    looted: false,
  };
}

export function populateWorld(state: GameState) {
  const put = (kind: EnemyKind, tx: number, ty: number) => state.enemies.push(spawnEnemy(kind, tx, ty));

  // Lobos nas planícies nevadas
  const wolfSpots = [
    [40, 55], [52, 50], [36, 66], [60, 60], [44, 72], [26, 52], [63, 68], [55, 44],
  ];
  for (const [x, y] of wolfSpots) put("wolf", x, y);

  // Bandidos no acampamento
  const camp = state.locations.find((l) => l.id === "banditcamp")!;
  put("bandit", camp.x - 2, camp.y);
  put("bandit", camp.x + 2, camp.y - 1);
  put("bandit", camp.x, camp.y + 2);
  put("bandit", camp.x + 1, camp.y + 1);

  // Draugr nas ruínas
  const bleak = state.locations.find((l) => l.id === "bleakfalls")!;
  put("draugr", bleak.x - 2, bleak.y + 1);
  put("draugr", bleak.x + 2, bleak.y - 1);
  put("draugr", bleak.x, bleak.y + 2);
  const frost = state.locations.find((l) => l.id === "frostmere")!;
  put("draugr", frost.x - 1, frost.y + 2);
  put("draugr", frost.x + 2, frost.y);
  put("draugr", frost.x - 2, frost.y - 1);
  put("draugr", frost.x + 1, frost.y + 1);

  // Aranhas na floresta
  put("spider", 24, 30);
  put("spider", 70, 48);
  put("spider", 34, 78);

  // Espectros no norte gelado
  put("wraith", 74, 20);
  put("wraith", 60, 16);
  put("wraith", 20, 14);

  // O chefe: Alduin no Túmulo do Culto do Dragão
  const cult = state.locations.find((l) => l.id === "dragoncult")!;
  put("dragon", cult.x, cult.y + 2);
}

export function updateEnemy(
  e: Enemy,
  state: GameState,
  world: WorldData,
  dt: number,
  fireEnemyProjectile: (e: Enemy) => void
) {
  if (e.dead) return;
  const def = ENEMIES[e.kind];
  const p = state.player;
  e.attackCd = Math.max(0, e.attackCd - dt);
  e.hitFlash = Math.max(0, e.hitFlash - dt);
  e.stateT -= dt;

  const dx = p.x - e.x;
  const dy = p.y - e.y;
  const dist = Math.hypot(dx, dy);
  const aggro = def.aggroRange * TILE;

  if (!p.dead && dist < aggro) {
    e.state = dist < (def.ranged ? 4.5 * TILE : 1.1 * TILE) ? "attack" : "chase";
  } else if (e.state === "chase" || e.state === "attack") {
    e.state = "patrol";
  }

  if (e.state === "chase") {
    const spd = def.speed * TILE;
    const nx = dx / Math.max(1, dist);
    const ny = dy / Math.max(1, dist);
    const res = collideCircle(world, e.x + nx * spd * dt, e.y + ny * spd * dt, 13 * def.scale);
    e.x = res.x;
    e.y = res.y;
    e.dir = Math.abs(nx) > Math.abs(ny) ? (nx < 0 ? 1 : 2) : ny < 0 ? 3 : 0;
    e.walkFrame += dt * 8;
  } else if (e.state === "attack") {
    e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
    if (def.ranged) {
      // mantém distância e atira
      if (dist < 3 * TILE) {
        const nx = -dx / Math.max(1, dist);
        const ny = -dy / Math.max(1, dist);
        const res = collideCircle(world, e.x + nx * def.speed * TILE * 0.7 * dt, e.y + ny * def.speed * TILE * 0.7 * dt, 13 * def.scale);
        e.x = res.x;
        e.y = res.y;
      }
      if (e.attackCd <= 0) {
        e.attackCd = e.kind === "dragon" ? 1.6 : 2.2;
        fireEnemyProjectile(e);
      }
    } else if (e.attackCd <= 0 && dist < 1.3 * TILE) {
      e.attackCd = 1.1;
      damagePlayer(state, def.dmg);
    }
  } else {
    // patrulha ao redor de casa
    if (e.stateT <= 0) {
      e.stateT = 1.5 + Math.random() * 2.5;
      e.dir = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
      if (Math.random() < 0.35) e.dir = 0;
    }
    const wander = e.kind === "dragon" ? 0 : 0.6;
    if (wander > 0) {
      const dvec = [
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: -1 },
      ][e.dir];
      const hx = e.homeX - e.x;
      const hy = e.homeY - e.y;
      const homeDist = Math.hypot(hx, hy);
      let mx = dvec.x * wander;
      let my = dvec.y * wander;
      if (homeDist > 4 * TILE) {
        mx = (hx / homeDist) * 1.2;
        my = (hy / homeDist) * 1.2;
      }
      const res = collideCircle(world, e.x + mx * TILE * dt, e.y + my * TILE * dt, 13 * def.scale);
      e.x = res.x;
      e.y = res.y;
      e.walkFrame += dt * 4;
    }
  }
}

export function damageEnemy(state: GameState, id: number, dmg: number, kx: number, ky: number) {
  const e = state.enemies.find((en) => en.id === id);
  if (!e || e.dead) return;
  e.hp -= dmg;
  e.hitFlash = 0.18;
  const def = ENEMIES[e.kind];
  // knockback
  const res = { x: e.x + kx * 0.12, y: e.y + ky * 0.12 };
  e.x = res.x;
  e.y = res.y;
  addFloat(state.floats, e.x, e.y - 34 * def.scale, `-${Math.round(dmg)}`, "#ffd23a");
  spawnBurst(state.particles, e.x, e.y - 10, "#8e2f22", 8, 120);
  if (e.hp <= 0) killEnemy(state, e);
}

function killEnemy(state: GameState, e: Enemy) {
  const def = ENEMIES[e.kind];
  e.dead = true;
  e.state = "dead";
  const p = state.player;
  spawnBurst(state.particles, e.x, e.y - 8, "#5a5f66", 22, 150);
  gainXp(state, def.xp);
  const gold = def.gold[0] + Math.floor(Math.random() * (def.gold[1] - def.gold[0] + 1));
  if (gold > 0) {
    p.gold += gold;
    addToast(state.toasts, `+${gold} de ouro`, def.name);
  }
  // loot
  const table = LOOT_TABLE[e.kind] ?? [];
  for (const drop of table) {
    if (Math.random() < drop.chance) {
      const qty = drop.qty[0] + Math.floor(Math.random() * (drop.qty[1] - drop.qty[0] + 1));
      if (qty > 0) {
        addItem(p, drop.itemId, qty);
        addToast(state.toasts, `Você obteve ${qty > 1 ? `${qty}x ` : ""}${drop.itemId.replace(/_/g, " ")}`);
      }
    }
  }
  // contadores de quest
  state.kills[e.kind] = (state.kills[e.kind] ?? 0) + 1;
  for (const q of state.quests) {
    if (q.state !== "active") continue;
    for (const obj of q.objectives) {
      if (obj.targetKind === e.kind && !obj.done && obj.targetCount) {
        obj.count = Math.min(obj.targetCount, (obj.count ?? 0) + 1);
        if (obj.count >= obj.targetCount) obj.done = true;
      }
    }
  }
  if (e.kind === "dragon") {
    state.dragonDefeated = true;
    addToast(state.toasts, "ALDUIN FOI DESTRUÍDO!", "O norte está salvo. Fale com o Ancião.");
  }
}


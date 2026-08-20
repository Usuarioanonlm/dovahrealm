// DovahRealm — projéteis (magia, flechas, fogo do dragão)
import { TILE, solidAtPx, type WorldData } from "./world";
import { spawnBurst, spawnTrail } from "./effects";
import { damageEnemy } from "./enemy";
import { damagePlayer } from "./player";
import type { GameState, Projectile } from "./types";

export function fireProjectile(
  state: GameState,
  kind: Projectile["kind"],
  x: number,
  y: number,
  tx: number,
  ty: number,
  dmg: number,
  fromPlayer: boolean
) {
  const dx = tx - x;
  const dy = ty - y;
  const d = Math.max(1, Math.hypot(dx, dy));
  const speed = kind === "arrow" ? 460 : kind === "frost" ? 420 : kind === "dragonfire" ? 300 : 340;
  state.projectiles.push({
    x,
    y,
    vx: (dx / d) * speed,
    vy: (dy / d) * speed,
    kind,
    dmg,
    fromPlayer,
    life: 1.6,
  });
}

export function updateProjectiles(state: GameState, world: WorldData, dt: number) {
  const ps = state.projectiles;
  for (let i = ps.length - 1; i >= 0; i--) {
    const pr = ps[i];
    pr.life -= dt;
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;

    const color =
      pr.kind === "fire" ? "#ff7a2f" : pr.kind === "frost" ? "#7fd4e8" : pr.kind === "dragonfire" ? "#ff4a2f" : "#c8b08a";
    spawnTrail(state.particles, pr.x, pr.y, color);

    let dead = pr.life <= 0;
    // colisão com parede
    if (!dead && solidAtPx(world, pr.x, pr.y)) dead = true;

    // colisão com alvos
    if (!dead && pr.fromPlayer) {
      for (const e of state.enemies) {
        if (e.dead) continue;
        const r = pr.kind === "arrow" ? 16 : 20;
        if (Math.hypot(e.x - pr.x, e.y - 10 - pr.y) < r) {
          damageEnemy(state, e.id, pr.dmg, pr.vx * 0.4, pr.vy * 0.4);
          dead = true;
          break;
        }
      }
    } else if (!dead && !pr.fromPlayer) {
      const p = state.player;
      if (!p.dead && Math.hypot(p.x - pr.x, p.y - 10 - pr.y) < 18) {
        damagePlayer(state, pr.dmg);
        dead = true;
      }
    }

    if (dead) {
      if (pr.kind === "fire" || pr.kind === "dragonfire") {
        spawnBurst(state.particles, pr.x, pr.y, "#ff7a2f", 18, 150, true);
        // dano em área pequeno para fogo
        if (pr.fromPlayer) {
          for (const e of state.enemies) {
            if (e.dead) continue;
            if (Math.hypot(e.x - pr.x, e.y - pr.y) < TILE) {
              damageEnemy(state, e.id, pr.dmg * 0.4, 0, 0);
            }
          }
        }
      } else if (pr.kind === "frost") {
        spawnBurst(state.particles, pr.x, pr.y, "#7fd4e8", 12, 120, true);
      }
      ps.splice(i, 1);
    }
  }
}

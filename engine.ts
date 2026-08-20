// DovahRealm — motor do jogo: loop, input (touch + teclado), câmera, render do mundo
import { ENEMIES } from "./items";
import {
  TILE,
  WORLD_H,
  WORLD_W,
  generateWorld,
  tileAt,
  type WorldData,
} from "./world";
import {
  getEnemySprite,
  getHeroSprite,
  getNpcSprite,
  tileSprite,
} from "./sprites";
import {
  addToast,
  spawnSnow,
  updateFloats,
  updateParticles,
  updateToasts,
} from "./effects";
import {
  addItem,
  createPlayer,
  gainXp,
  playerAttack,
  playerCast,
  playerShout,
  updatePlayer,
  type CombatCtx,
} from "./player";
import {
  damageEnemy,
  populateWorld,
  updateEnemy,
} from "./enemy";
import { createNpcs, nearestNpc, updateNpcs } from "./npc";
import { fireProjectile, updateProjectiles } from "./projectile";
import { createQuests } from "./quest";
import { computeLayout, drawHud, type HudLayout } from "./hud";
import { saveGame, loadGame } from "./save";
import { sfx } from "./audio";
import type { GameState, SpellId, UiEventHandler } from "./types";

export interface GameHandle {
  dispose: () => void;
  getState: () => GameState;
  onUiEvent: (h: UiEventHandler) => void;
  closeMenu: () => void;
  performAction: (action: string, payload?: unknown) => void;
}

const AUTOSAVE_T = 20;

export function createGame(canvas: HTMLCanvasElement): GameHandle {
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  // ---------- Mundo e estado ----------
  const world: WorldData = generateWorld();

  function freshState(): GameState {
    return {
      player: createPlayer(world.spawnX, world.spawnY),
      enemies: [],
      npcs: createNpcs(),
      quests: createQuests(),
      locations: world.locations,
      timeOfDay: 0.35,
      day: 1,
      projectiles: [],
      particles: [],
      floats: [],
      toasts: [],
      kills: {},
      dragonDefeated: false,
    };
  }

  let state: GameState = freshState();
  populateWorld(state);

  // ---------- Input ----------
  const keys = new Set<string>();
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    new URLSearchParams(window.location.search).has("mobile");
  let vw = canvas.clientWidth || window.innerWidth;
  let vh = canvas.clientHeight || window.innerHeight;
  let layout: HudLayout = computeLayout(vw, vh, isTouch);

  let joyActive = false;
  let joyPointer = -1;
  let joyVec = { x: 0, y: 0 };
  let paused = false;
  let started = false;
  let gameOverSent = false;
  let victorySent = false;
  let autosaveT = AUTOSAVE_T;
  let uiHandler: UiEventHandler = () => {};
  const demoMode = new URLSearchParams(window.location.search).has("demo");
  let demoT = 0;

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = canvas.clientWidth || window.innerWidth;
    vh = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    layout = computeLayout(vw, vh, isTouch);
  };
  resize();
  window.addEventListener("resize", resize);

  // ---------- Câmera ----------
  let camX = state.player.x - vw / 2;
  let camY = state.player.y - vh / 2;

  // ---------- Helpers de combate ----------
  const combatCtx: CombatCtx = {
    damageEnemy: (id, dmg, kx, ky) => {
      damageEnemy(state, id, dmg, kx, ky);
      sfx.hit();
    },
    enemiesInArc: (x, y, dir, range, arc) => {
      const facing = Math.atan2([0, -1, 1, 0][dir], [1, 0, 0, -1][dir]);
      const ids: number[] = [];
      for (const e of state.enemies) {
        if (e.dead) continue;
        const dx = e.x - x;
        const dy = e.y - y;
        const d = Math.hypot(dx, dy);
        if (d > range) continue;
        let rel = Math.atan2(dy, dx) - facing;
        while (rel > Math.PI) rel -= Math.PI * 2;
        while (rel < -Math.PI) rel += Math.PI * 2;
        if (Math.abs(rel) < arc / 2 || d < TILE * 0.7) ids.push(e.id);
      }
      return ids;
    },
    fireProjectile: (kind, x, y, tx, ty, dmg) => {
      fireProjectile(state, kind, x, y, tx, ty, dmg, true);
      if (kind === "fire") sfx.fire();
      else if (kind === "frost") sfx.frost();
      else sfx.swing();
    },
    nearestEnemy: (x, y, range) => {
      let best: { id: number; x: number; y: number } | null = null;
      let bd = range;
      for (const e of state.enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x - x, e.y - y);
        if (d < bd) {
          bd = d;
          best = { id: e.id, x: e.x, y: e.y };
        }
      }
      return best;
    },
  };

  function tryInteract() {
    const npc = nearestNpc(state, 1.7 * TILE);
    if (npc) {
      uiHandler({ type: "openDialog", npcId: npc.id });
      paused = true;
      return;
    }
    const p = state.player;
    const camp = state.locations.find((l) => l.id === "banditcamp")!;
    if (Math.hypot(p.x - camp.x * TILE, p.y - camp.y * TILE) < 2 * TILE) {
      const q = state.quests.find((q) => q.id === "golden_claw");
      if (q && q.state === "active" && !q.objectives[0].done) {
        q.objectives[0].done = true;
        addItem(p, "golden_claw", 1);
        addToast(state.toasts, "Você obteve a Garra Dourada!", "Volte ao Mercador Lucan");
        sfx.quest();
        return;
      }
    }
    const bleak = state.locations.find((l) => l.id === "bleakfalls")!;
    if (Math.hypot(p.x - bleak.x * TILE, p.y - bleak.y * TILE) < 2.5 * TILE) {
      const q = state.quests.find((q) => q.id === "main_dragon");
      if (q && q.state === "active" && !q.objectives[1].done) {
        q.objectives[1].done = true;
        addItem(p, "dragon_stone", 1);
        addToast(state.toasts, "Você obteve a Pedra do Dragão!", "O caminho ao Túmulo foi revelado");
        const cult = state.locations.find((l) => l.id === "dragoncult")!;
        cult.discovered = true;
        sfx.quest();
        return;
      }
    }
    addToast(state.toasts, "Nada para interagir aqui");
  }

  // ---------- Ponteiros (touch/mouse) ----------
  const pointers = new Map<number, { x: number; y: number }>();

  function pointPos(e: PointerEvent): { x: number; y: number } {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerDown(e: PointerEvent) {
    if (!started || paused) return;
    const pos = pointPos(e);
    pointers.set(e.pointerId, pos);

    const j = layout.joystick;
    if (Math.hypot(pos.x - j.x, pos.y - j.y) < j.r * 1.4 && joyPointer === -1) {
      joyPointer = e.pointerId;
      joyActive = true;
      updateJoy(pos);
      return;
    }
    for (const b of layout.buttons) {
      if (Math.hypot(pos.x - b.x, pos.y - b.y) < b.r * 1.15) {
        e.preventDefault();
        if (b.id === "attack") {
          playerAttack(state, combatCtx);
          sfx.swing();
        } else if (b.id === "cast") {
          playerCast(state, combatCtx);
        } else if (b.id === "shout") {
          playerShout(state, combatCtx);
          sfx.shout();
        } else if (b.id === "interact") {
          tryInteract();
        }
        return;
      }
    }
    for (const m of layout.menuButtons) {
      if (pos.x >= m.x && pos.x <= m.x + m.w && pos.y >= m.y && pos.y <= m.y + m.h) {
        uiHandler({ type: "openMenu", menu: m.id });
        paused = true;
        return;
      }
    }
    // toque no mundo: falar com NPC tocado
    const wx = camX + pos.x / (isTouch ? 1.15 : 1);
    const wy = camY + pos.y / (isTouch ? 1.15 : 1);
    for (const n of state.npcs) {
      if (
        Math.hypot(n.x - wx, n.y - wy) < TILE &&
        Math.hypot(n.x - state.player.x, n.y - state.player.y) < 2.2 * TILE
      ) {
        uiHandler({ type: "openDialog", npcId: n.id });
        paused = true;
        return;
      }
    }
  }

  function updateJoy(pos: { x: number; y: number }) {
    const j = layout.joystick;
    let dx = (pos.x - j.x) / (j.r * 0.8);
    let dy = (pos.y - j.y) / (j.r * 0.8);
    const l = Math.hypot(dx, dy);
    if (l > 1) {
      dx /= l;
      dy /= l;
    }
    joyVec = { x: dx, y: dy };
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return;
    const pos = pointPos(e);
    pointers.set(e.pointerId, pos);
    if (e.pointerId === joyPointer) updateJoy(pos);
  }

  function onPointerUp(e: PointerEvent) {
    pointers.delete(e.pointerId);
    if (e.pointerId === joyPointer) {
      joyPointer = -1;
      joyActive = false;
      joyVec = { x: 0, y: 0 };
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  function onKeyDown(e: KeyboardEvent) {
    if (!started || paused) return;
    const k = e.key.toLowerCase();
    keys.add(k);
    if (k === " " || k === "j") {
      playerAttack(state, combatCtx);
      sfx.swing();
      e.preventDefault();
    } else if (k === "k") {
      playerCast(state, combatCtx);
    } else if (k === "l") {
      playerShout(state, combatCtx);
      sfx.shout();
    } else if (k === "e" || k === "f") {
      tryInteract();
    } else if (k === "i") {
      uiHandler({ type: "openMenu", menu: "inventory" });
      paused = true;
    } else if (k === "m") {
      uiHandler({ type: "openMenu", menu: "map" });
      paused = true;
    } else if (k === "q") {
      uiHandler({ type: "openMenu", menu: "quests" });
      paused = true;
    } else if (k === "c") {
      uiHandler({ type: "openMenu", menu: "character" });
      paused = true;
    } else if (k === "1" && state.player.spells.includes("fire")) {
      state.player.spell = "fire";
    } else if (k === "2" && state.player.spells.includes("frost")) {
      state.player.spell = "frost";
    } else if (k === "3" && state.player.spells.includes("heal")) {
      state.player.spell = "heal";
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    keys.delete(e.key.toLowerCase());
  }
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  // ---------- Update ----------
  function update(dt: number) {
    if (paused || !started) return;

    let ix = joyVec.x;
    let iy = joyVec.y;
    if (keys.has("w") || keys.has("arrowup")) iy -= 1;
    if (keys.has("s") || keys.has("arrowdown")) iy += 1;
    if (keys.has("a") || keys.has("arrowleft")) ix -= 1;
    if (keys.has("d") || keys.has("arrowright")) ix += 1;
    const sprint = keys.has("shift");

    if (demoMode) {
      demoT += dt;
      ix = Math.sin(demoT * 0.6) * 0.8;
      iy = Math.cos(demoT * 0.4) * 0.8 - 0.4;
      if (demoT % 3 < dt) playerAttack(state, combatCtx);
      if (demoT % 5 < dt) playerCast(state, combatCtx);
    }

    updatePlayer(state, world, dt, { x: ix, y: iy, sprint });
    updateNpcs(state, world, dt);
    for (const e of state.enemies) {
      updateEnemy(e, state, world, dt, (en) => {
        const kind = en.kind === "dragon" ? "dragonfire" : "frost";
        fireProjectile(state, kind, en.x, en.y - 10, state.player.x, state.player.y - 8, ENEMIES[en.kind].dmg, false);
        if (en.kind === "dragon") sfx.dragon();
      });
    }
    updateProjectiles(state, world, dt);
    updateParticles(state.particles, dt);
    updateFloats(state.floats, dt);
    updateToasts(state.toasts, dt);

    spawnSnow(state.particles, camX, camY, vw, vh);

    state.timeOfDay += dt / 480;
    if (state.timeOfDay >= 1) {
      state.timeOfDay -= 1;
      state.day++;
    }

    for (const loc of state.locations) {
      if (loc.discovered) continue;
      if (Math.hypot(loc.x * TILE - state.player.x, loc.y * TILE - state.player.y) < 5 * TILE) {
        loc.discovered = true;
        addToast(state.toasts, `Local descoberto: ${loc.name}`);
        sfx.quest();
        gainXp(state, 25);
      }
    }

    for (const q of state.quests) {
      if (q.state !== "active") continue;
      for (const obj of q.objectives) {
        if (obj.locationId && !obj.done) {
          const loc = state.locations.find((l) => l.id === obj.locationId);
          if (loc && Math.hypot(loc.x * TILE - state.player.x, loc.y * TILE - state.player.y) < 4 * TILE) {
            obj.done = true;
            addToast(state.toasts, "Objetivo atualizado", q.name);
            sfx.quest();
          }
        }
      }
    }

    if (state.player.dead && !gameOverSent) {
      gameOverSent = true;
      sfx.death();
      paused = true;
      setTimeout(() => uiHandler({ type: "gameOver" }), 900);
    }
    const mainQ = state.quests.find((q) => q.id === "main_dragon");
    if (state.dragonDefeated && mainQ?.state === "turned" && !victorySent) {
      victorySent = true;
      paused = true;
      setTimeout(() => uiHandler({ type: "victory" }), 600);
    }

    autosaveT -= dt;
    if (autosaveT <= 0) {
      autosaveT = AUTOSAVE_T;
      saveGame(state);
    }

    const zoom = isTouch ? 1.15 : 1;
    const tx = state.player.x - vw / (2 * zoom);
    const ty = state.player.y - vh / (2 * zoom);
    camX += (tx - camX) * Math.min(1, dt * 6);
    camY += (ty - camY) * Math.min(1, dt * 6);
    camX = Math.max(0, Math.min(WORLD_W * TILE - vw / zoom, camX));
    camY = Math.max(0, Math.min(WORLD_H * TILE - vh / zoom, camY));
  }

  // ---------- Render ----------
  function render() {
    const zoom = isTouch ? 1.15 : 1;
    ctx.fillStyle = "#101820";
    ctx.fillRect(0, 0, vw, vh);
    if (!started) return;

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);

    const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
    const y0 = Math.max(0, Math.floor(camY / TILE) - 1);
    const x1 = Math.min(WORLD_W - 1, Math.ceil((camX + vw / zoom) / TILE) + 1);
    const y1 = Math.min(WORLD_H - 1, Math.ceil((camY + vh / zoom) / TILE) + 1);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = tileAt(world, tx, ty);
        const variant = (tx * 7 + ty * 13) % 4;
        ctx.drawImage(tileSprite(t, variant), tx * TILE, ty * TILE, TILE, TILE);
      }
    }

    // casas das vilas (desenhadas sobre os tiles de parede em pares 2x2)
    for (const loc of state.locations) {
      if (loc.kind !== "village") continue;
      if (Math.abs(loc.x * TILE - (camX + vw / 2)) > vw || Math.abs(loc.y * TILE - (camY + vh / 2)) > vh) continue;
      const houses = [
        [loc.x - 4, loc.y - 3],
        [loc.x + 3, loc.y - 3],
        [loc.x - 4, loc.y + 2],
        [loc.x + 3, loc.y + 2],
      ];
      for (const [hx, hy] of houses) {
        const px = hx * TILE;
        const py = hy * TILE;
        // corpo da casa (madeira)
        ctx.fillStyle = "#5c3a21";
        ctx.fillRect(px - 4, py - 10, TILE * 2 + 8, TILE * 2 + 10);
        ctx.fillStyle = "#6b4a2a";
        for (let i = 0; i < 5; i++) ctx.fillRect(px - 4, py - 6 + i * 18, TILE * 2 + 8, 3);
        // telhado de palha com neve
        ctx.fillStyle = "#8a6a3a";
        ctx.beginPath();
        ctx.moveTo(px - 12, py - 8);
        ctx.lineTo(px + TILE, py - 34);
        ctx.lineTo(px + TILE * 2 + 12, py - 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#dfe8ee";
        ctx.beginPath();
        ctx.moveTo(px - 12, py - 8);
        ctx.lineTo(px + TILE, py - 34);
        ctx.lineTo(px + TILE * 2 + 12, py - 8);
        ctx.lineTo(px + TILE * 2 + 4, py - 12);
        ctx.lineTo(px + TILE, py - 26);
        ctx.lineTo(px - 4, py - 12);
        ctx.closePath();
        ctx.fill();
        // porta e janelas quentes
        ctx.fillStyle = "#2b1d0e";
        ctx.fillRect(px + TILE - 8, py + TILE + 6, 16, 24);
        ctx.fillStyle = "#ffb84a";
        ctx.fillRect(px + 10, py + TILE - 2, 10, 10);
        ctx.fillRect(px + TILE * 2 - 20, py + TILE - 2, 10, 10);
        ctx.fillStyle = "#2b1d0e88";
        ctx.fillRect(px + 14, py + TILE - 2, 2, 10);
        ctx.fillRect(px + TILE * 2 - 16, py + TILE - 2, 2, 10);
      }
    }

    // marcador de quest principal
    const activeQ = state.quests.find((q) => q.state === "active" && q.isMain);
    if (activeQ) {
      const obj = activeQ.objectives.find((o) => !o.done);
      const locId = obj?.locationId ?? (obj?.itemId === "dragon_stone" ? "bleakfalls" : undefined);
      const loc = state.locations.find((l) => l.id === locId);
      if (loc) {
        const pulse = 0.5 + Math.sin(performance.now() / 300) * 0.3;
        ctx.strokeStyle = `rgba(232, 194, 58, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(loc.x * TILE + TILE / 2, loc.y * TILE + TILE / 2, TILE * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const p = state.player;
    const walkF = Math.floor(p.walkFrame) % 4;
    const attackF = p.attackCd > 0.24 ? 1 : 0;

    interface Ent {
      y: number;
      draw: () => void;
    }
    const ents: Ent[] = [];

    for (const n of state.npcs) {
      ents.push({
        y: n.y,
        draw: () => {
          const spr = getNpcSprite(n.kind, 0);
          ctx.drawImage(spr, n.x - 24, n.y - 52, 48, 60);
          if (n.questId) {
            const q = state.quests.find((q) => q.id === n.questId);
            const bob = Math.sin(performance.now() / 300) * 3;
            if (q?.state === "available") {
              ctx.fillStyle = "#e8c23a";
              ctx.font = "700 18px Cinzel, serif";
              ctx.textAlign = "center";
              ctx.fillText("!", n.x, n.y - 58 + bob);
            } else if (q?.state === "active" && q.objectives.every((o) => o.done)) {
              ctx.fillStyle = "#8fe89a";
              ctx.font = "700 18px Cinzel, serif";
              ctx.textAlign = "center";
              ctx.fillText("?", n.x, n.y - 58 + bob);
            }
          }
        },
      });
    }

    for (const e of state.enemies) {
      if (e.dead) continue;
      const def = ENEMIES[e.kind];
      ents.push({
        y: e.y,
        draw: () => {
          const wf = Math.floor(e.walkFrame) % 4;
          const spr = getEnemySprite(e.kind, wf, e.hitFlash > 0);
          const w = 60 * def.scale;
          const h = 48 * def.scale;
          ctx.drawImage(spr, e.x - w / 2, e.y - h + 8, w, h);
          if (e.hp < e.maxHp) {
            const bw = 36 * def.scale;
            ctx.fillStyle = "#1a120acc";
            ctx.fillRect(e.x - bw / 2, e.y - h - 2, bw, 5);
            ctx.fillStyle = "#a83226";
            ctx.fillRect(e.x - bw / 2 + 0.5, e.y - h - 1.5, (bw - 1) * (e.hp / e.maxHp), 4);
          }
          if (e.kind === "dragon") {
            ctx.fillStyle = "#e83a3a";
            ctx.font = "700 13px Cinzel, serif";
            ctx.textAlign = "center";
            ctx.fillText("ALDUIN", e.x, e.y - h - 8);
          }
        },
      });
    }

    ents.push({
      y: p.y,
      draw: () => {
        if (p.dead) {
          ctx.globalAlpha = 0.5;
        } else if (p.invuln > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
          ctx.globalAlpha = 0.55;
        }
        const spr = getHeroSprite(p.dir, walkF, attackF);
        ctx.drawImage(spr, p.x - 24, p.y - 52, 48, 60);
        ctx.globalAlpha = 1;
        if (p.hitFlash > 0) {
          ctx.fillStyle = `rgba(232, 58, 58, ${p.hitFlash})`;
          ctx.fillRect(p.x - 24, p.y - 52, 48, 60);
        }
      },
    });

    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) e.draw();

    for (const pr of state.projectiles) {
      const color =
        pr.kind === "fire" ? "#ff7a2f" : pr.kind === "frost" ? "#7fd4e8" : pr.kind === "dragonfire" ? "#ff4a2f" : "#c8b08a";
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = pr.kind === "arrow" ? 0 : 12;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.kind === "arrow" ? 3 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (const pt of state.particles) {
      const a = Math.max(0, pt.life / pt.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      if (pt.glow) {
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 8;
      }
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    for (const f of state.floats) {
      ctx.globalAlpha = Math.min(1, f.life / 0.3);
      ctx.font = "700 15px Cinzel, serif";
      ctx.strokeStyle = "#1a120a";
      ctx.lineWidth = 3;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // ciclo dia/noite
    const t = state.timeOfDay;
    let darkness = 0;
    if (t < 0.22) darkness = 0.45 - (t / 0.22) * 0.45;
    else if (t < 0.7) darkness = 0;
    else if (t < 0.8) darkness = ((t - 0.7) / 0.1) * 0.45;
    else darkness = 0.45;
    if (darkness > 0) {
      ctx.fillStyle = `rgba(10, 18, 40, ${darkness})`;
      ctx.fillRect(0, 0, vw, vh);
    }

    const vg = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.45, vw / 2, vh / 2, Math.max(vw, vh) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(10,8,4,0.35)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, vw, vh);

    const npc = nearestNpc(state, 1.7 * TILE);
    const hint = npc ? `Falar com ${npc.name}` : null;
    drawHud(ctx, state, world, layout, vw, vh, joyActive, joyVec, hint);
  }

  // ---------- Loop ----------
  let raf = 0;
  let last = performance.now();
  function loop(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  // ---------- API pública ----------
  return {
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
    getState: () => state,
    onUiEvent(h) {
      uiHandler = h;
    },
    closeMenu() {
      paused = false;
      saveGame(state);
    },
    performAction(action, payload) {
      if (action === "start") {
        started = true;
        paused = false;
      } else if (action === "newGame") {
        state = freshState();
        populateWorld(state);
        gameOverSent = false;
        victorySent = false;
        started = true;
        paused = false;
        camX = state.player.x - vw / 2;
        camY = state.player.y - vh / 2;
      } else if (action === "continue") {
        const data = loadGame();
        if (data?.player) {
          const fs = freshState();
          state = {
            ...fs,
            player: { ...fs.player, ...data.player },
            quests: data.quests ?? fs.quests,
            timeOfDay: data.timeOfDay ?? 0.35,
            day: data.day ?? 1,
            kills: data.kills ?? {},
            dragonDefeated: data.dragonDefeated ?? false,
          };
          if (data.locations) {
            for (const saved of data.locations) {
              const loc = world.locations.find((l) => l.id === saved.id);
              if (loc) loc.discovered = saved.discovered;
            }
            state.locations = world.locations;
          }
          populateWorld(state);
          if (state.dragonDefeated) {
            state.enemies = state.enemies.filter((e) => e.kind !== "dragon");
          }
          camX = state.player.x - vw / 2;
          camY = state.player.y - vh / 2;
        }
        started = true;
        paused = false;
      } else if (action === "resume") {
        paused = false;
      } else if (action === "pause") {
        paused = true;
      } else if (action === "respawn") {
        const p = state.player;
        p.dead = false;
        p.hp = p.maxHp;
        p.mp = p.maxMp;
        p.sp = p.maxSp;
        p.x = world.spawnX;
        p.y = world.spawnY;
        p.gold = Math.max(0, Math.floor(p.gold * 0.9));
        gameOverSent = false;
        paused = false;
        camX = p.x - vw / 2;
        camY = p.y - vh / 2;
        addToast(state.toasts, "Você desperta em Riofrio", "Os deuses ainda têm planos para você");
      } else if (action === "setSpell") {
        state.player.spell = payload as SpellId;
      } else if (action === "teleport") {
        const { x, y } = payload as { x: number; y: number };
        state.player.x = x * TILE + TILE / 2;
        state.player.y = y * TILE + TILE / 2;
        camX = state.player.x - vw / 2;
        camY = state.player.y - vh / 2;
      } else if (action === "activateQuest") {
        const q = state.quests.find((q) => q.id === (payload as string));
        if (q) q.state = "active";
      }
    },
  };
}

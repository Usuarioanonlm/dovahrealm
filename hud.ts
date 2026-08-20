// DovahRealm — HUD desenhado no canvas: barras, bússola de bronze, joystick, botões touch
// Estilo: bronze-rúnico #b08d3f sobre couro escuro (ver ideas.md)
import { SPELLS } from "./items";
import { TILE, WORLD_H, WORLD_W, type WorldData } from "./world";
import type { GameState } from "./types";

export interface TouchButton {
  id: "attack" | "cast" | "shout" | "interact" | "menu";
  x: number;
  y: number;
  r: number;
  label: string;
}

export interface HudLayout {
  joystick: { x: number; y: number; r: number };
  buttons: TouchButton[];
  menuButtons: { id: "inventory" | "map" | "quests" | "character"; x: number; y: number; w: number; h: number; label: string }[];
  isTouch: boolean;
}

export function computeLayout(vw: number, vh: number, isTouch: boolean): HudLayout {
  const jr = Math.min(70, vw * 0.16);
  const joystick = { x: jr + 26, y: vh - jr - 30, r: jr };
  const br = Math.min(34, vw * 0.075);
  const bx = vw - br - 22;
  const by = vh - br - 26;
  const buttons: TouchButton[] = [
    { id: "attack", x: bx, y: by, r: br, label: "⚔" },
    { id: "cast", x: bx - br * 2.1, y: by - br * 0.5, r: br * 0.85, label: "✦" },
    { id: "shout", x: bx - br * 0.6, y: by - br * 2.1, r: br * 0.85, label: "ᚠ" },
    { id: "interact", x: bx - br * 2.5, y: by - br * 1.9, r: br * 0.75, label: "!" },
  ];
  const mw = 34;
  const menuButtons = (["inventory", "map", "quests", "character"] as const).map((id, i) => ({
    id,
    x: vw - mw - 8,
    y: 90 + i * (mw + 10),
    w: mw,
    h: mw,
    label: { inventory: "🎒", map: "🗺", quests: "📜", character: "🛡" }[id],
  }));
  return { joystick, buttons, menuButtons, isTouch };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pct: number, color: string, bg = "#1a120acc") {
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (pct > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x + 1.5, y + 1.5, Math.max(h - 3, (w - 3) * pct), h - 3, (h - 3) / 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#b08d3f88";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.stroke();
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  world: WorldData,
  layout: HudLayout,
  vw: number,
  vh: number,
  joyActive: boolean,
  joyVec: { x: number; y: number },
  interactHint: string | null
) {
  const p = state.player;

  // ---- Barras de status (canto superior esquerdo) ----
  const bw = Math.min(190, vw * 0.42);
  bar(ctx, 14, 14, bw, 13, p.hp / p.maxHp, "#a83226");
  bar(ctx, 14, 31, bw * 0.85, 10, p.mp / p.maxMp, "#2f5a8e");
  bar(ctx, 14, 45, bw * 0.7, 8, p.sp / p.maxSp, "#3a7a4a");
  ctx.fillStyle = "#e8d5a8";
  ctx.font = "600 11px Alegreya, serif";
  ctx.textAlign = "left";
  ctx.fillText(`Nv ${p.level}`, 14 + bw + 8, 24);
  // XP fina
  bar(ctx, 14, 57, bw, 4, p.xp / p.xpNext, "#b08d3f", "#1a120a88");
  // ouro
  ctx.fillStyle = "#e8c23a";
  ctx.font = "600 13px Alegreya, serif";
  ctx.fillText(`◉ ${p.gold}`, 14, 78);

  // ---- Bússola de bronze (topo centro) ----
  const cw = Math.min(320, vw * 0.5);
  const cx = vw / 2 - cw / 2;
  const cy = 10;
  const grad = ctx.createLinearGradient(0, cy, 0, cy + 26);
  grad.addColorStop(0, "#2b1d0edd");
  grad.addColorStop(1, "#1a120acc");
  ctx.fillStyle = grad;
  roundRect(ctx, cx, cy, cw, 26, 13);
  ctx.fill();
  ctx.strokeStyle = "#b08d3f";
  ctx.lineWidth = 1.5;
  roundRect(ctx, cx, cy, cw, 26, 13);
  ctx.stroke();

  // direção do jogador → pontos cardeais
  const heading = Math.atan2(p.y - 0, 0) * 0; // bússola baseada na direção do olhar
  void heading;
  const dirAngle = [Math.PI / 2, Math.PI, 0, -Math.PI / 2][p.dir];
  const cardinals: { a: number; l: string }[] = [
    { a: -Math.PI / 2, l: "N" },
    { a: 0, l: "L" },
    { a: Math.PI / 2, l: "S" },
    { a: Math.PI, l: "O" },
  ];
  ctx.textAlign = "center";
  for (const c of cardinals) {
    let rel = c.a - dirAngle;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;
    if (Math.abs(rel) > Math.PI * 0.55) continue;
    const px = vw / 2 + (rel / (Math.PI * 0.55)) * (cw / 2 - 14);
    ctx.fillStyle = Math.abs(rel) < 0.2 ? "#e8c23a" : "#e8d5a8aa";
    ctx.font = "700 13px Cinzel, serif";
    ctx.fillText(c.l, px, cy + 17);
  }
  // marcadores de locais descobertos + quest ativa
  for (const loc of world.locations) {
    if (!loc.discovered) continue;
    const lx = loc.x * TILE - p.x;
    const ly = loc.y * TILE - p.y;
    let rel = Math.atan2(ly, lx) - dirAngle;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;
    if (Math.abs(rel) > Math.PI * 0.55) continue;
    const px = vw / 2 + (rel / (Math.PI * 0.55)) * (cw / 2 - 14);
    ctx.fillStyle = loc.kind === "village" ? "#8fe89a" : loc.kind === "cave" ? "#e83a3a" : "#7fd4e8";
    ctx.font = "10px serif";
    ctx.fillText(loc.kind === "village" ? "⌂" : loc.kind === "cave" ? "▲" : "◆", px, cy + 24);
  }

  // ---- Magia ativa (canto inferior centro-esq) ----
  const spell = SPELLS[p.spell];
  ctx.fillStyle = "#1a120acc";
  roundRect(ctx, 14, vh - 44, 150, 32, 8);
  ctx.fill();
  ctx.strokeStyle = "#b08d3f88";
  roundRect(ctx, 14, vh - 44, 150, 32, 8);
  ctx.stroke();
  ctx.fillStyle = spell.color;
  ctx.font = "700 12px Alegreya, serif";
  ctx.textAlign = "left";
  ctx.fillText(`✦ ${spell.name}`, 22, vh - 24);

  // ---- Dica de interação ----
  if (interactHint) {
    ctx.font = "600 14px Alegreya, serif";
    const tw = ctx.measureText(interactHint).width + 28;
    ctx.fillStyle = "#1a120add";
    roundRect(ctx, vw / 2 - tw / 2, vh - 120, tw, 30, 15);
    ctx.fill();
    ctx.strokeStyle = "#b08d3f";
    roundRect(ctx, vw / 2 - tw / 2, vh - 120, tw, 30, 15);
    ctx.stroke();
    ctx.fillStyle = "#e8d5a8";
    ctx.textAlign = "center";
    ctx.fillText(interactHint, vw / 2, vh - 100);
  }

  // ---- Controles touch ----
  if (layout.isTouch) {
    // joystick
    const j = layout.joystick;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#1a120a";
    ctx.beginPath();
    ctx.arc(j.x, j.y, j.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#b08d3f";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = joyActive ? 0.85 : 0.5;
    const kx = j.x + joyVec.x * j.r * 0.55;
    const ky = j.y + joyVec.y * j.r * 0.55;
    const kg = ctx.createRadialGradient(kx, ky, 2, kx, ky, j.r * 0.42);
    kg.addColorStop(0, "#b08d3f");
    kg.addColorStop(1, "#6b4a1a");
    ctx.fillStyle = kg;
    ctx.beginPath();
    ctx.arc(kx, ky, j.r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // botões de ação
    for (const b of layout.buttons) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#1a120a";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = b.id === "attack" ? "#e8c23a" : "#b08d3f";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = b.id === "shout" ? "#a8d8e8" : "#e8d5a8";
      ctx.font = `${Math.round(b.r * 0.9)}px Cinzel, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.label, b.x, b.y + 1);
      ctx.textBaseline = "alphabetic";
      ctx.globalAlpha = 1;
      // cooldown shout
      if (b.id === "shout" && p.shoutCd > 0) {
        ctx.fillStyle = "#000000aa";
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + (p.shoutCd / 8) * Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // ---- Botões de menu (lateral direita) ----
  for (const m of layout.menuButtons) {
    ctx.fillStyle = "#1a120acc";
    roundRect(ctx, m.x, m.y, m.w, m.h, 8);
    ctx.fill();
    ctx.strokeStyle = "#b08d3f88";
    ctx.lineWidth = 1;
    roundRect(ctx, m.x, m.y, m.w, m.h, 8);
    ctx.stroke();
    ctx.font = "16px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(m.label, m.x + m.w / 2, m.y + m.h / 2 + 1);
    ctx.textBaseline = "alphabetic";
  }

  // ---- Toasts de loot (canto superior direito, abaixo da bússola) ----
  let ty = 48;
  ctx.textAlign = "right";
  for (const t of state.toasts) {
    const alpha = Math.min(1, t.t / 0.6);
    ctx.globalAlpha = alpha * 0.92;
    const tw = Math.max(ctx.measureText(t.text).width, t.sub ? ctx.measureText(t.sub).width : 0) + 24;
    ctx.fillStyle = "#1a120a";
    roundRect(ctx, vw - tw - 52, ty, tw, t.sub ? 40 : 26, 6);
    ctx.fill();
    ctx.strokeStyle = "#b08d3f66";
    roundRect(ctx, vw - tw - 52, ty, tw, t.sub ? 40 : 26, 6);
    ctx.stroke();
    ctx.fillStyle = "#e8d5a8";
    ctx.font = "600 12px Alegreya, serif";
    ctx.fillText(t.text, vw - 64, ty + 16);
    if (t.sub) {
      ctx.fillStyle = "#b08d3f";
      ctx.font = "11px Alegreya, serif";
      ctx.fillText(t.sub, vw - 64, ty + 31);
    }
    ctx.globalAlpha = 1;
    ty += t.sub ? 48 : 32;
  }
  ctx.textAlign = "left";

  // ---- Minimapa (canto superior direito, pequeno) — só desktop ----
  if (!layout.isTouch) {
    const mm = 110;
    const mx = vw - mm - 16;
    const my = vh - mm - 16;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#0d0a06";
    roundRect(ctx, mx - 3, my - 3, mm + 6, mm + 6, 8);
    ctx.fill();
    const sx = mm / (WORLD_W * TILE);
    const sy = mm / (WORLD_H * TILE);
    for (const loc of world.locations) {
      if (!loc.discovered) continue;
      ctx.fillStyle = loc.kind === "village" ? "#8fe89a" : loc.kind === "cave" ? "#e83a3a" : "#7fd4e8";
      ctx.fillRect(mx + loc.x * TILE * sx - 2, my + loc.y * TILE * sy - 2, 4, 4);
    }
    ctx.fillStyle = "#e8c23a";
    ctx.fillRect(mx + p.x * sx - 1.5, my + p.y * sy - 1.5, 3, 3);
    ctx.strokeStyle = "#b08d3f";
    ctx.lineWidth = 1.5;
    roundRect(ctx, mx - 3, my - 3, mm + 6, mm + 6, 8);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

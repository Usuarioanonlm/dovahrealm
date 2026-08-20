// DovahRealm — pixel-art procedural: todos os sprites do jogo são desenhados em código
// e cacheados em offscreen canvases. Direção de arte: Grimório Nórdico (ver ideas.md).
import type { Dir, EnemyKind, NpcKind } from "./types";

const cache = new Map<string, HTMLCanvasElement>();

function make(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

type Px = [number, number, number, number, string]; // x,y,w,h,color

function drawPixels(ctx: CanvasRenderingContext2D, scale: number, pixels: Px[]) {
  for (const [x, y, w, h, color] of pixels) {
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
  }
}

// ---- Paleta ----
const SKIN = "#d9a877";
const SKIN_D = "#b8875c";
const FUR = "#6b4a2a";
const FUR_D = "#4e3319";
const IRON = "#8a939e";
const IRON_D = "#5a636d";
const CLOAK = "#7a3b2e";
const CLOAK_D = "#5a2a20";

// Herói 16x20 (grid lógico), renderizado a 48x60
function heroFrame(dir: Dir, walk: number, attack: number): HTMLCanvasElement {
  const key = `hero_${dir}_${walk}_${attack}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const S = 3;
  const [c, ctx] = make(16 * S, 20 * S);
  const bob = walk === 1 || walk === 3 ? 1 : 0;
  const legOff = walk === 1 ? 1 : walk === 3 ? -1 : 0;

  const px: Px[] = [];
  // capa (atrás)
  px.push([4, 6 + bob, 8, 9, CLOAK_D]);
  // pernas
  px.push([5 + legOff, 15, 2, 4, FUR_D]);
  px.push([9 - legOff, 15, 2, 4, FUR_D]);
  // botas
  px.push([5 + legOff, 18, 2, 1, "#2b1d0e"]);
  px.push([9 - legOff, 18, 2, 1, "#2b1d0e"]);
  // torso (armadura de pelo)
  px.push([4, 8 + bob, 8, 7, FUR]);
  px.push([4, 8 + bob, 8, 2, FUR_D]);
  px.push([7, 10 + bob, 2, 5, IRON_D]); // cinto/placa
  // braços
  if (attack > 0) {
    // braço da espada estendido
    px.push([11, 8 + bob, 4, 2, SKIN]);
    px.push([14, 4 + bob, 2, 8, IRON]); // lâmina para cima
    px.push([14, 4 + bob, 2, 1, "#dfe8ee"]);
    px.push([13, 11 + bob, 4, 1, "#8a5a2a"]); // guarda
  } else {
    px.push([2, 9 + bob, 2, 5, SKIN]);
    px.push([12, 9 + bob, 2, 5, SKIN]);
    // espada na mão direita, para baixo
    px.push([13, 13 + bob, 1, 6, IRON]);
    px.push([12, 13 + bob, 3, 1, "#8a5a2a"]);
  }
  // cabeça
  px.push([5, 2 + bob, 6, 6, SKIN]);
  // elmo de ferro com chifres
  px.push([4, 1 + bob, 8, 3, IRON]);
  px.push([4, 3 + bob, 8, 1, IRON_D]);
  px.push([2, 0 + bob, 2, 3, "#e8dcc0"]); // chifre esq
  px.push([12, 0 + bob, 2, 3, "#e8dcc0"]); // chifre dir
  // rosto conforme direção
  if (dir === 0) {
    px.push([6, 5 + bob, 1, 1, "#2b1d0e"]);
    px.push([9, 5 + bob, 1, 1, "#2b1d0e"]);
    px.push([6, 7 + bob, 4, 1, SKIN_D]); // barba
  } else if (dir === 1) {
    px.push([5, 5 + bob, 1, 1, "#2b1d0e"]);
    px.push([5, 7 + bob, 3, 1, SKIN_D]);
  } else if (dir === 2) {
    px.push([10, 5 + bob, 1, 1, "#2b1d0e"]);
    px.push([8, 7 + bob, 3, 1, SKIN_D]);
  } else {
    // costas: capa cobre tudo
    px.push([4, 4 + bob, 8, 6, CLOAK]);
    px.push([4, 4 + bob, 8, 2, CLOAK_D]);
  }
  drawPixels(ctx, S, px);
  cache.set(key, c);
  return c;
}

// ---- Inimigos ----
function enemySprite(kind: EnemyKind, walk: number, flash: boolean): HTMLCanvasElement {
  const key = `enemy_${kind}_${walk}_${flash ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const S = 3;
  const [c, ctx] = make(20 * S, 16 * S);
  const px: Px[] = [];
  const F = flash ? "#ffffff" : null;

  if (kind === "wolf") {
    const body = F ?? "#6e6a63";
    const dark = F ?? "#4a4741";
    const legOff = walk === 1 ? 1 : walk === 3 ? -1 : 0;
    px.push([4, 6, 11, 5, body]); // corpo
    px.push([14, 4, 5, 4, body]); // cabeça
    px.push([18, 5, 2, 2, dark]); // focinho
    px.push([14, 3, 2, 2, dark]); // orelha
    px.push([17, 5, 1, 1, F ? "#fff" : "#e8c23a"]); // olho
    px.push([1, 5, 4, 2, dark]); // cauda
    px.push([5 + legOff, 11, 2, 4, dark]);
    px.push([8, 11, 2, 4, dark]);
    px.push([12 - legOff, 11, 2, 4, dark]);
    px.push([15, 11, 2, 4, dark]);
  } else if (kind === "bandit") {
    const cloth = F ?? "#5a4a6b";
    const legOff = walk === 1 ? 1 : walk === 3 ? -1 : 0;
    px.push([7 + legOff, 11, 2, 4, "#3a2f24"]);
    px.push([11 - legOff, 11, 2, 4, "#3a2f24"]);
    px.push([6, 6, 8, 6, cloth]); // torso
    px.push([6, 6, 8, 2, F ?? "#7a6a3a"]); // ombreira de pelo
    px.push([7, 1, 6, 5, F ?? SKIN]); // cabeça
    px.push([7, 1, 6, 2, F ?? "#3a2f24"]); // capuz/faixa
    px.push([8, 4, 1, 1, "#2b1d0e"]);
    px.push([11, 4, 1, 1, "#2b1d0e"]);
    px.push([13, 7, 2, 5, F ?? SKIN]); // braço
    px.push([14, 3, 1, 5, F ?? IRON]); // machado
    px.push([13, 3, 3, 2, F ?? IRON_D]);
  } else if (kind === "draugr") {
    const bone = F ?? "#9aa38f";
    const legOff = walk === 1 ? 1 : walk === 3 ? -1 : 0;
    px.push([7 + legOff, 11, 2, 4, F ?? "#5a6355"]);
    px.push([11 - legOff, 11, 2, 4, F ?? "#5a6355"]);
    px.push([6, 5, 8, 7, F ?? "#6b7466"]); // torso apodrecido
    px.push([6, 5, 8, 2, F ?? IRON_D]); // peitoral antigo
    px.push([7, 0, 6, 5, bone]); // crânio
    px.push([8, 2, 1, 1, F ? "#fff" : "#5ac8e8"]); // olho brilhante
    px.push([11, 2, 1, 1, F ? "#fff" : "#5ac8e8"]);
    px.push([8, 4, 4, 1, F ?? "#3a4038"]);
    px.push([13, 6, 2, 5, bone]); // braço
    px.push([14, 2, 1, 6, F ?? "#7a8288"]); // espada enferrujada
  } else if (kind === "spider") {
    const body = F ?? "#4a5a6b";
    const legOff = walk === 1 ? 1 : walk === 3 ? -1 : 0;
    px.push([7, 6, 7, 6, body]); // abdômen
    px.push([12, 7, 5, 4, F ?? "#3a4a5a"]); // cefalotórax
    px.push([15, 8, 1, 1, F ? "#fff" : "#e83a3a"]);
    px.push([13, 8, 1, 1, F ? "#fff" : "#e83a3a"]);
    // 8 pernas
    for (let i = 0; i < 4; i++) {
      px.push([3 + i * 2 + (i % 2 ? legOff : -legOff), 4 + i, 4, 1, body]);
      px.push([3 + i * 2 - (i % 2 ? legOff : -legOff), 12 - i, 4, 1, body]);
    }
    px.push([8, 7, 3, 3, F ?? "#7fd4e8"]); // marca de gelo
  } else if (kind === "wraith") {
    const mist = F ?? "#8fd8e8";
    const mistD = F ?? "#5aa8c8";
    const wob = walk % 2;
    px.push([6, 2 + wob, 8, 5, mist]); // capuz espectral
    px.push([5, 6, 10, 4, mist]);
    px.push([4, 9, 12, 3, mistD]);
    px.push([5, 12, 3, 2, mistD]);
    px.push([9, 12, 3, 2, mistD]);
    px.push([13, 12, 3, 2, mistD]);
    px.push([8, 4 + wob, 1, 1, "#0a2832"]); // olhos vazios
    px.push([11, 4 + wob, 1, 1, "#0a2832"]);
    px.push([9, 6 + wob, 2, 2, "#0a2832"]); // boca
  } else if (kind === "dragon") {
    const scale = F ?? "#8e2f22";
    const dark = F ?? "#5a1d14";
    const wing = F ?? "#b8552f";
    const wingD = F ?? "#7a3520";
    const belly = F ?? "#d8a06a";
    const flap = walk % 2;
    // cauda longa com espinhos
    px.push([0, 9, 6, 2, dark]);
    px.push([0, 8, 2, 2, dark]);
    px.push([2, 7, 1, 1, dark]);
    px.push([4, 8, 1, 1, dark]);
    // corpo principal
    px.push([5, 6, 10, 6, scale]);
    px.push([6, 8, 8, 3, belly]); // barriga clara
    // espinhas dorsais
    px.push([6, 5, 1, 1, dark]);
    px.push([8, 5, 1, 1, dark]);
    px.push([10, 5, 1, 1, dark]);
    px.push([12, 5, 1, 1, dark]);
    // pescoço e cabeça
    px.push([14, 4, 3, 4, scale]);
    px.push([15, 2, 5, 4, scale]); // crânio
    px.push([18, 3, 2, 2, dark]); // focinho
    px.push([19, 4, 1, 1, "#ffd23a"]); // narina
    // chifres curvos
    px.push([15, 0, 1, 2, "#e8dcc0"]);
    px.push([17, 0, 1, 2, "#e8dcc0"]);
    px.push([14, 0, 1, 1, "#e8dcc0"]);
    px.push([18, 0, 1, 1, "#e8dcc0"]);
    // olho flamejante
    px.push([16, 3, 1, 1, F ? "#fff" : "#ffb84a"]);
    // mandíbula
    px.push([16, 5, 4, 1, dark]);
    // asas grandes (dois lados)
    if (flap) {
      // asas para cima
      px.push([1, 0, 8, 2, wing]);
      px.push([2, 2, 7, 2, wing]);
      px.push([3, 4, 5, 2, wingD]);
      px.push([0, 1, 2, 1, wingD]);
    } else {
      // asas abertas
      px.push([0, 3, 9, 2, wing]);
      px.push([1, 1, 7, 2, wing]);
      px.push([2, 5, 6, 1, wingD]);
      px.push([0, 2, 2, 1, wingD]);
    }
    // pernas com garras
    px.push([7, 12, 2, 3, dark]);
    px.push([12, 12, 2, 3, dark]);
    px.push([6, 14, 3, 1, "#e8dcc0"]);
    px.push([11, 14, 3, 1, "#e8dcc0"]);
  }
  drawPixels(ctx, S, px);
  cache.set(key, c);
  return c;
}

// ---- NPCs ----
function npcSprite(kind: NpcKind, walk: number): HTMLCanvasElement {
  const key = `npc_${kind}_${walk}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const S = 3;
  const [c, ctx] = make(16 * S, 20 * S);
  const px: Px[] = [];
  const legOff = walk === 1 ? 1 : walk === 3 ? -1 : 0;
  const robe: Record<NpcKind, string> = {
    elder: "#7a6a8a",
    blacksmith: "#5a4a3a",
    merchant: "#8a5a3a",
    guard: "#5a636d",
    mage: "#6b4a8a",
    innkeeper: "#7a3b2e",
    bard: "#3a6b5a",
  };
  const r = robe[kind];
  px.push([5 + legOff, 15, 2, 4, "#2b1d0e"]);
  px.push([9 - legOff, 15, 2, 4, "#2b1d0e"]);
  px.push([4, 7, 8, 9, r]); // robe/túnica
  px.push([4, 7, 8, 2, r === "#5a636d" ? IRON : "#00000033"]);
  px.push([5, 2, 6, 5, SKIN]); // cabeça
  if (kind === "elder") {
    px.push([5, 5, 6, 4, "#dfe8ee"]); // barba longa
    px.push([4, 1, 8, 2, "#dfe8ee"]); // cabelo branco
    px.push([12, 4, 1, 12, "#8a5a2a"]); // cajado
    px.push([11, 3, 3, 2, "#b08d3f"]);
  } else if (kind === "blacksmith") {
    px.push([5, 1, 6, 2, "#3a2f24"]);
    px.push([4, 9, 8, 5, "#3a2f24"]); // avental
    px.push([12, 6, 2, 4, "#5a636d"]); // martelo
  } else if (kind === "merchant") {
    px.push([4, 1, 8, 2, "#b08d3f"]); // gorro dourado
    px.push([5, 5, 6, 2, SKIN_D]);
  } else if (kind === "guard") {
    px.push([4, 1, 8, 3, IRON]); // elmo
    px.push([12, 3, 1, 13, "#8a5a2a"]); // lança
    px.push([11, 2, 3, 2, IRON]);
  } else if (kind === "mage") {
    px.push([4, 0, 8, 3, "#6b4a8a"]); // capuz
    px.push([5, 4, 6, 3, "#4e3568"]);
    px.push([12, 5, 1, 10, "#5a3a2a"]); // bastão
    px.push([11, 3, 3, 3, "#9a6fd0"]); // orbe
  } else if (kind === "innkeeper") {
    px.push([5, 1, 6, 2, "#7a3b2e"]);
    px.push([4, 9, 8, 4, "#e8d5a8"]); // avental claro
  } else if (kind === "bard") {
    px.push([4, 1, 8, 2, "#3a6b5a"]);
    px.push([11, 8, 4, 5, "#8a5a2a"]); // alaúde
    px.push([12, 7, 2, 1, "#8a5a2a"]);
  }
  px.push([6, 4, 1, 1, "#2b1d0e"]);
  px.push([9, 4, 1, 1, "#2b1d0e"]);
  drawPixels(ctx, S, px);
  cache.set(key, c);
  return c;
}

// ---- Tiles ----
export function tileSprite(type: string, variant: number): HTMLCanvasElement {
  const key = `tile_${type}_${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const S = 3;
  const [c, ctx] = make(16 * S, 16 * S);
  const rnd = (i: number) => {
    const v = Math.sin(variant * 127.1 + i * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const noise = (base: string, dark: string, n: number) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 16 * S, 16 * S);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = rnd(i) > 0.5 ? dark : base;
      ctx.fillRect(Math.floor(rnd(i + 50) * 16) * S, Math.floor(rnd(i + 90) * 16) * S, S * (1 + Math.floor(rnd(i + 7) * 2)), S);
    }
  };

  switch (type) {
    case "snow":
      noise("#c3d2de", "#d8e4ec", 16);
      // sombras azuladas de terreno
      ctx.fillStyle = "#b4c6d4";
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(Math.floor(rnd(i + 21) * 14) * S, Math.floor(rnd(i + 41) * 16) * S, (2 + Math.floor(rnd(i + 9) * 3)) * S, S);
      }
      break;
    case "grass":
      noise("#55663f", "#47573a", 18);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = "#dfe8ee";
        ctx.fillRect(Math.floor(rnd(i + 11) * 16) * S, Math.floor(rnd(i + 31) * 16) * S, 2 * S, S);
      }
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = "#6b7a4a";
        ctx.fillRect(Math.floor(rnd(i + 61) * 15) * S, Math.floor(rnd(i + 71) * 16) * S, S, 2 * S);
      }
      break;
    case "forest": {
      noise("#4a5a48", "#3e4c3c", 20);
      // pinheiro
      ctx.fillStyle = "#1e3328";
      ctx.fillRect(5 * S, 2 * S, 6 * S, 4 * S);
      ctx.fillRect(4 * S, 5 * S, 8 * S, 4 * S);
      ctx.fillRect(3 * S, 8 * S, 10 * S, 4 * S);
      ctx.fillStyle = "#2a4536";
      ctx.fillRect(6 * S, 3 * S, 3 * S, 2 * S);
      ctx.fillRect(5 * S, 6 * S, 4 * S, 2 * S);
      ctx.fillStyle = "#dfe8ee"; // neve no topo
      ctx.fillRect(6 * S, 2 * S, 4 * S, S);
      ctx.fillRect(5 * S, 5 * S, 3 * S, S);
      ctx.fillStyle = "#4e3319"; // tronco
      ctx.fillRect(7 * S, 12 * S, 2 * S, 3 * S);
      break;
    }
    case "deadtree": {
      noise("#cfdce6", "#dfe8ee", 22);
      ctx.fillStyle = "#3a2f24";
      ctx.fillRect(7 * S, 6 * S, 2 * S, 9 * S);
      ctx.fillRect(4 * S, 4 * S, 4 * S, S);
      ctx.fillRect(9 * S, 2 * S, 4 * S, S);
      ctx.fillRect(11 * S, 3 * S, S, 3 * S);
      ctx.fillRect(5 * S, 5 * S, S, 2 * S);
      break;
    }
    case "rock":
      noise("#5a5f66", "#4a4e55", 24);
      ctx.fillStyle = "#6b7076";
      ctx.fillRect(3 * S, 4 * S, 5 * S, 4 * S);
      ctx.fillRect(9 * S, 9 * S, 4 * S, 3 * S);
      ctx.fillStyle = "#dfe8ee";
      ctx.fillRect(3 * S, 3 * S, 4 * S, S);
      break;
    case "water": {
      noise("#1d3a4d", "#24506b", 18);
      ctx.fillStyle = "#3d7a9a";
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(Math.floor(rnd(i + 3) * 14) * S, Math.floor(rnd(i + 13) * 16) * S, 3 * S, S);
      }
      break;
    }
    case "ice":
      noise("#a8c8d8", "#bcd8e6", 20);
      ctx.fillStyle = "#e8f4f8";
      ctx.fillRect(2 * S, 5 * S, 6 * S, S);
      ctx.fillRect(8 * S, 10 * S, 5 * S, S);
      break;
    case "path":
      noise("#8a7350", "#7a6344", 28);
      ctx.fillStyle = "#9a8360";
      ctx.fillRect(2 * S, 3 * S, 3 * S, 2 * S);
      ctx.fillRect(10 * S, 9 * S, 3 * S, 2 * S);
      break;
    case "floor":
      noise("#8a8578", "#7a7568", 20);
      ctx.strokeStyle = "#5a5f66";
      ctx.lineWidth = S;
      ctx.strokeRect(0.5 * S, 0.5 * S, 15 * S, 15 * S);
      ctx.beginPath();
      ctx.moveTo(8 * S, 0);
      ctx.lineTo(8 * S, 16 * S);
      ctx.stroke();
      break;
    case "wall":
      noise("#4a4e55", "#3e4248", 14);
      ctx.fillStyle = "#5a5f66";
      for (let r = 0; r < 4; r++) {
        for (let cx = 0; cx < 3; cx++) {
          ctx.fillRect((cx * 6 + (r % 2) * 3) * S - S, r * 4 * S, 5 * S, 3 * S);
        }
      }
      ctx.fillStyle = "#7fd4e833";
      ctx.fillRect(6 * S, 6 * S, 2 * S, 2 * S); // runa fraca
      break;
    case "bridge":
      noise("#6b4a2a", "#5a3d22", 12);
      ctx.fillStyle = "#7a5636";
      for (let i = 0; i < 4; i++) ctx.fillRect(0, i * 4 * S, 16 * S, 3 * S);
      ctx.fillStyle = "#4e3319";
      ctx.fillRect(0, 0, S, 16 * S);
      ctx.fillRect(15 * S, 0, S, 16 * S);
      break;
    case "door":
      noise("#1a120a", "#0d0a06", 8);
      ctx.fillStyle = "#b08d3f";
      ctx.fillRect(6 * S, 4 * S, 4 * S, 8 * S);
      ctx.fillStyle = "#7fd4e8";
      ctx.fillRect(7 * S, 6 * S, 2 * S, 2 * S);
      break;
    default:
      noise("#ff00ff", "#ff00ff", 1);
  }
  cache.set(key, c);
  return c;
}

// ---- Ícones de itens (24x24 lógico → 48x48) ----
export function itemIcon(icon: string): HTMLCanvasElement {
  const key = `icon_${icon}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const S = 2;
  const [c, ctx] = make(24 * S, 24 * S);
  const px: Px[] = [];
  switch (icon) {
    case "sword_iron":
    case "sword_steel":
    case "sword_dragon": {
      const blade = icon === "sword_dragon" ? "#c85a3a" : icon === "sword_steel" ? "#cfdce6" : IRON;
      px.push([11, 2, 3, 14, blade]);
      px.push([12, 2, 1, 14, "#ffffff55"]);
      px.push([11, 2, 3, 2, "#e8dcc0"]);
      px.push([8, 16, 9, 2, "#8a5a2a"]);
      px.push([11, 18, 3, 4, "#5a3d22"]);
      break;
    }
    case "axe":
      px.push([11, 3, 2, 18, "#5a3d22"]);
      px.push([6, 3, 8, 7, "#6b8a5a"]);
      px.push([6, 3, 3, 7, "#8aa87a"]);
      break;
    case "dagger":
      px.push([11, 6, 3, 10, IRON]);
      px.push([9, 16, 7, 2, "#8a5a2a"]);
      px.push([11, 18, 3, 3, "#5a3d22"]);
      break;
    case "bow":
      px.push([6, 2, 3, 20, "#8a5a2a"]);
      px.push([9, 3, 2, 4, "#8a5a2a"]);
      px.push([9, 17, 2, 4, "#8a5a2a"]);
      px.push([10, 2, 8, 1, "#dfe8ee"]);
      px.push([10, 21, 8, 1, "#dfe8ee"]);
      px.push([17, 3, 1, 18, "#dfe8ee"]);
      break;
    case "armor_fur":
    case "armor_iron":
    case "armor_steel":
    case "armor_dragon": {
      const m = icon === "armor_dragon" ? "#a84a35" : icon === "armor_steel" ? "#cfdce6" : icon === "armor_iron" ? IRON : FUR;
      px.push([7, 4, 10, 4, m]);
      px.push([5, 8, 14, 10, m]);
      px.push([5, 8, 14, 2, "#00000033"]);
      px.push([10, 4, 4, 3, "#2b1d0e"]);
      px.push([5, 18, 14, 2, "#00000044"]);
      break;
    }
    case "potion_red":
    case "potion_blue":
    case "potion_green": {
      const l = icon === "potion_red" ? "#d83a3a" : icon === "potion_blue" ? "#3a7ad8" : "#3ad85a";
      px.push([10, 3, 4, 3, "#8a5a2a"]);
      px.push([9, 6, 6, 2, "#a8c8d8"]);
      px.push([7, 8, 10, 11, l]);
      px.push([8, 9, 3, 4, "#ffffff66"]);
      px.push([7, 17, 10, 2, "#00000033"]);
      break;
    }
    case "tome_fire":
    case "tome_frost":
    case "tome_heal": {
      const cover = icon === "tome_fire" ? "#8e2f22" : icon === "tome_frost" ? "#2f5a8e" : "#3a7a4a";
      px.push([5, 3, 14, 18, cover]);
      px.push([5, 3, 3, 18, "#00000044"]);
      px.push([9, 8, 6, 6, "#b08d3f"]);
      px.push([10, 9, 4, 4, icon === "tome_fire" ? "#ff7a2f" : icon === "tome_frost" ? "#7fd4e8" : "#8fe89a"]);
      break;
    }
    case "claw":
      px.push([8, 4, 4, 14, "#b08d3f"]);
      px.push([13, 6, 4, 3, "#b08d3f"]);
      px.push([13, 11, 4, 3, "#b08d3f"]);
      px.push([13, 16, 4, 3, "#b08d3f"]);
      px.push([16, 6, 2, 2, "#e8c23a"]);
      break;
    case "stone":
      px.push([6, 4, 12, 16, "#5a5f66"]);
      px.push([8, 7, 8, 2, "#7fd4e8"]);
      px.push([8, 11, 8, 2, "#7fd4e8"]);
      px.push([8, 15, 5, 2, "#7fd4e8"]);
      break;
    case "gem":
      px.push([9, 4, 6, 4, "#9a6fd0"]);
      px.push([7, 8, 10, 6, "#9a6fd0"]);
      px.push([9, 14, 6, 6, "#7a4fb0"]);
      px.push([10, 6, 2, 3, "#e8d5ff"]);
      break;
    case "ore":
      px.push([6, 10, 12, 8, "#5a5f66"]);
      px.push([8, 6, 8, 5, "#6b7076"]);
      px.push([9, 8, 3, 3, "#c8855a"]);
      px.push([13, 12, 3, 3, "#c8855a"]);
      break;
    case "pelt":
      px.push([5, 6, 14, 12, "#6e6a63"]);
      px.push([7, 4, 10, 3, "#6e6a63"]);
      px.push([5, 6, 14, 2, "#4a4741"]);
      px.push([8, 10, 3, 3, "#4a4741"]);
      break;
    case "bread":
      px.push([5, 9, 14, 8, "#c89a5a"]);
      px.push([5, 9, 14, 3, "#a87a3a"]);
      px.push([8, 11, 2, 2, "#8a5a2a"]);
      px.push([13, 11, 2, 2, "#8a5a2a"]);
      break;
    case "torch":
      px.push([11, 8, 3, 13, "#5a3d22"]);
      px.push([9, 3, 7, 6, "#ff7a2f"]);
      px.push([11, 2, 3, 3, "#ffd23a"]);
      break;
    default:
      px.push([6, 6, 12, 12, "#b08d3f"]);
  }
  drawPixels(ctx, S, px);
  cache.set(key, c);
  return c;
}

export function getHeroSprite(dir: Dir, walkFrame: number, attackFrame: number): HTMLCanvasElement {
  return heroFrame(dir, walkFrame, attackFrame);
}
export function getEnemySprite(kind: EnemyKind, walkFrame: number, flash: boolean): HTMLCanvasElement {
  return enemySprite(kind, walkFrame, flash);
}
export function getNpcSprite(kind: NpcKind, walkFrame: number): HTMLCanvasElement {
  return npcSprite(kind, walkFrame);
}

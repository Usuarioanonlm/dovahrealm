// DovahRealm — geração e consulta do mundo (tilemap 96x96, biomas nórdicos)
import type { Location, TileType } from "./types";

export const WORLD_W = 96;
export const WORLD_H = 96;
export const TILE = 48; // px por tile

// RNG determinístico (mulberry32) para mundo estável entre sessões
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ruído de valor simples com interpolação suave
function hash2(x: number, y: number, seed: number): number {
  let h = x * 374761393 + y * 668265263 + seed * 1442695041;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}
export function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const u = smooth(xf);
  const v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, seed: number, oct = 4): number {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    v += valueNoise(x * f, y * f, seed + i * 101) * amp;
    amp *= 0.5;
    f *= 2;
  }
  return v;
}

export interface WorldData {
  tiles: TileType[]; // WORLD_W * WORLD_H
  locations: Location[];
  spawnX: number; // px
  spawnY: number;
}

const SOLID: ReadonlySet<TileType> = new Set<TileType>(["forest", "deadtree", "rock", "water", "wall"]);

export function isSolid(t: TileType): boolean {
  return SOLID.has(t);
}

export function tileAt(w: WorldData, tx: number, ty: number): TileType {
  if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return "rock";
  return w.tiles[ty * WORLD_W + tx];
}

export function solidAtPx(w: WorldData, px: number, py: number): boolean {
  return isSolid(tileAt(w, Math.floor(px / TILE), Math.floor(py / TILE)));
}

// Colisão de círculo contra tiles sólidos
export function collideCircle(w: WorldData, x: number, y: number, r: number): { x: number; y: number } {
  let nx = x;
  let ny = y;
  const minTx = Math.floor((nx - r) / TILE);
  const maxTx = Math.floor((nx + r) / TILE);
  const minTy = Math.floor((ny - r) / TILE);
  const maxTy = Math.floor((ny + r) / TILE);
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (!isSolid(tileAt(w, tx, ty))) continue;
      const cx = Math.max(tx * TILE, Math.min(nx, tx * TILE + TILE));
      const cy = Math.max(ty * TILE, Math.min(ny, ty * TILE + TILE));
      const dx = nx - cx;
      const dy = ny - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < r * r && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        nx = cx + (dx / d) * r;
        ny = cy + (dy / d) * r;
      } else if (d2 <= 0.0001) {
        ny = ty * TILE - r - 0.1;
      }
    }
  }
  return { x: nx, y: ny };
}

export const LOCATIONS: Omit<Location, "discovered">[] = [
  { id: "riverwood", name: "Vila de Riofrio", x: 48, y: 62, kind: "village" },
  { id: "whiterun", name: "Fortaleza de Brumaval", x: 30, y: 40, kind: "village" },
  { id: "bleakfalls", name: "Ruína de Véu Sinistro", x: 66, y: 30, kind: "ruin" },
  { id: "dragoncult", name: "Túmulo do Culto do Dragão", x: 80, y: 14, kind: "cave" },
  { id: "shrine", name: "Santuário de Talos", x: 20, y: 70, kind: "shrine" },
  { id: "banditcamp", name: "Acampamento de Bandidos", x: 58, y: 76, kind: "camp" },
  { id: "frostmere", name: "Cripta de Gelomargo", x: 14, y: 22, kind: "ruin" },
];

export function generateWorld(seed = 20260820): WorldData {
  const tiles: TileType[] = new Array(WORLD_W * WORLD_H).fill("snow");
  const rng = makeRng(seed);

  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const e = fbm(x / 18, y / 18, seed, 4); // elevação
      const m = fbm(x / 14 + 40, y / 14 + 40, seed + 7, 3); // umidade/floresta
      let t: TileType = "snow";
      if (e > 0.72) t = "rock";
      else if (e > 0.62) t = m > 0.5 ? "rock" : "snow";
      else if (m > 0.62) t = "forest";
      else if (m > 0.56) t = rng() > 0.5 ? "forest" : "snow";
      else if (e < 0.3) t = "grass";
      else t = "snow";
      tiles[y * WORLD_W + x] = t;
    }
  }

  // Rio sinuoso de cima a baixo
  let rx = 20 + Math.floor(rng() * 20);
  for (let y = 0; y < WORLD_H; y++) {
    rx += Math.floor(rng() * 5) - 2;
    rx = Math.max(6, Math.min(WORLD_W - 7, rx));
    const wdt = 1 + (fbm(y / 10, 3, seed + 31) > 0.55 ? 1 : 0);
    for (let dx = -wdt; dx <= wdt; dx++) {
      const x = rx + dx;
      const i = y * WORLD_W + x;
      tiles[i] = fbm(x / 6, y / 6, seed + 77) > 0.42 ? "ice" : "water";
    }
  }

  // Trilhas ligando locais (L simples)
  const carve = (x0: number, y0: number, x1: number, y1: number) => {
    let x = x0;
    let y = y0;
    while (x !== x1) {
      tiles[y * WORLD_W + x] = "path";
      x += Math.sign(x1 - x);
    }
    while (y !== y1) {
      tiles[y * WORLD_W + x] = "path";
      y += Math.sign(y1 - y);
    }
    tiles[y * WORLD_W + x] = "path";
  };
  carve(48, 62, 30, 40);
  carve(48, 62, 66, 30);
  carve(48, 62, 20, 70);
  carve(48, 62, 58, 76);
  carve(66, 30, 80, 14);
  carve(30, 40, 14, 22);

  // Pontes onde a trilha cruza água
  for (let y = 1; y < WORLD_H - 1; y++) {
    for (let x = 1; x < WORLD_W - 1; x++) {
      const i = y * WORLD_W + x;
      if (tiles[i] === "path") continue;
      if (
        (tiles[i] === "water" || tiles[i] === "ice") &&
        ((tiles[i - 1] === "path" && tiles[i + 1] === "path") ||
          (tiles[i - WORLD_W] === "path" && tiles[i + WORLD_W] === "path"))
      ) {
        tiles[i] = "bridge";
      }
    }
  }

  // Construção dos locais
  const clearArea = (cx: number, cy: number, r: number, floor: TileType) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 1 || y < 1 || x >= WORLD_W - 1 || y >= WORLD_H - 1) continue;
        const d = Math.hypot(x - cx, y - cy);
        if (d <= r) tiles[y * WORLD_W + x] = floor;
      }
    }
  };

  const buildVillage = (cx: number, cy: number) => {
    clearArea(cx, cy, 5, "floor");
    // casas (blocos 2x2 de parede) ao redor do centro
    const houses = [
      [cx - 4, cy - 3],
      [cx + 3, cy - 3],
      [cx - 4, cy + 2],
      [cx + 3, cy + 2],
    ];
    for (const [hx, hy] of houses) {
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) tiles[(hy + dy) * WORLD_W + (hx + dx)] = "wall";
    }
  };

  const buildRuin = (cx: number, cy: number) => {
    clearArea(cx, cy, 4, "floor");
    // anel de pilares
    for (let a = 0; a < 8; a++) {
      const px = Math.round(cx + Math.cos((a / 8) * Math.PI * 2) * 3);
      const py = Math.round(cy + Math.sin((a / 8) * Math.PI * 2) * 3);
      tiles[py * WORLD_W + px] = "wall";
    }
  };

  const buildCave = (cx: number, cy: number) => {
    clearArea(cx, cy, 4, "rock");
    clearArea(cx, cy, 2, "floor");
    tiles[cy * WORLD_W + cx] = "door";
  };

  const buildShrine = (cx: number, cy: number) => {
    clearArea(cx, cy, 3, "floor");
    tiles[(cy - 1) * WORLD_W + cx] = "wall"; // altar
  };

  const buildCamp = (cx: number, cy: number) => {
    clearArea(cx, cy, 4, "grass");
    // fogueira central fica como floor; tendas como deadtree
    tiles[(cy - 2) * WORLD_W + (cx - 2)] = "deadtree";
    tiles[(cy - 2) * WORLD_W + (cx + 2)] = "deadtree";
  };

  for (const loc of LOCATIONS) {
    if (loc.kind === "village") buildVillage(loc.x, loc.y);
    else if (loc.kind === "ruin") buildRuin(loc.x, loc.y);
    else if (loc.kind === "cave") buildCave(loc.x, loc.y);
    else if (loc.kind === "shrine") buildShrine(loc.x, loc.y);
    else if (loc.kind === "camp") buildCamp(loc.x, loc.y);
  }

  // Árvores mortas esparsas
  for (let i = 0; i < 60; i++) {
    const x = 2 + Math.floor(rng() * (WORLD_W - 4));
    const y = 2 + Math.floor(rng() * (WORLD_H - 4));
    if (tiles[y * WORLD_W + x] === "snow") tiles[y * WORLD_W + x] = "deadtree";
  }

  const locations: Location[] = LOCATIONS.map((l) => ({
    ...l,
    discovered: l.id === "riverwood",
  }));

  return {
    tiles,
    locations,
    spawnX: 48 * TILE + TILE / 2,
    spawnY: 66 * TILE,
  };
}

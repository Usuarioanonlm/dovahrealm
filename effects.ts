// DovahRealm — partículas, textos flutuantes de dano e toasts de loot
import type { FloatText, Particle, Toast } from "./types";

export function spawnBurst(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  count: number,
  speed = 120,
  glow = false
) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.3 + Math.random() * 0.7);
    const life = 0.35 + Math.random() * 0.4;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life,
      maxLife: life,
      size: 2 + Math.random() * 3,
      color,
      glow,
    });
  }
}

export function spawnTrail(particles: Particle[], x: number, y: number, color: string) {
  particles.push({
    x: x + (Math.random() - 0.5) * 6,
    y: y + (Math.random() - 0.5) * 6,
    vx: (Math.random() - 0.5) * 20,
    vy: (Math.random() - 0.5) * 20,
    life: 0.3,
    maxLife: 0.3,
    size: 2 + Math.random() * 2,
    color,
    glow: true,
  });
}

export function spawnSnow(particles: Particle[], camX: number, camY: number, vw: number, vh: number) {
  if (particles.length > 260) return;
  for (let i = 0; i < 3; i++) {
    particles.push({
      x: camX + Math.random() * vw,
      y: camY - 10,
      vx: -12 - Math.random() * 18,
      vy: 28 + Math.random() * 26,
      life: 6,
      maxLife: 6,
      size: 1 + Math.random() * 2,
      color: "#eef4f8",
    });
  }
}

export function updateParticles(particles: Particle[], dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.gravity) p.vy += p.gravity * dt;
  }
}

export function addFloat(floats: FloatText[], x: number, y: number, text: string, color: string) {
  floats.push({ x, y, text, color, life: 0.9 });
}

export function updateFloats(floats: FloatText[], dt: number) {
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    f.life -= dt;
    f.y -= 34 * dt;
    if (f.life <= 0) floats.splice(i, 1);
  }
}

export function addToast(toasts: Toast[], text: string, sub?: string) {
  toasts.push({ text, sub, t: 3.2 });
  if (toasts.length > 4) toasts.shift();
}

export function updateToasts(toasts: Toast[], dt: number) {
  for (let i = toasts.length - 1; i >= 0; i--) {
    toasts[i].t -= dt;
    if (toasts[i].t <= 0) toasts.splice(i, 1);
  }
}


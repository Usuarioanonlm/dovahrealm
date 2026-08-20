# DovahRealm — Arquitetura

## Camadas
- **React (moldura)**: `App.tsx` → `GameCanvas.tsx` (canvas full-screen) + overlays de UI (título, HUD é desenhado no canvas; menus grimório são React para acessibilidade/touch).
- **Jogo (pintura)**: `client/src/game/**` — TypeScript puro, sem React, sem dependências externas. Canvas 2D nativo (sem engine pesada: o jogo é 2D top-down; Canvas2D é mais leve e rápido em mobile que Babylon para este caso).

## Módulos (`client/src/game/`)
| Arquivo | Responsabilidade |
|---|---|
| `engine.ts` | Loop principal (fixed timestep), resize, input agregado |
| `scene.ts` | `createGameScene(engine, canvas)` — contrato com o React |
| `world.ts` | Geração do tilemap 96x96, biomas, locais, colisão, descoberta |
| `tiles.ts` | Render do tilemap (tiles procedurais desenhados em offscreen canvas) |
| `player.ts` | Estado do jogador: stats, XP, equipamento, movimento, combate, magia, shout |
| `enemy.ts` | IA inimiga (idle/patrol/chase/attack/flee), tipos, boss dragão |
| `npc.ts` | NPCs, diálogos, lojas |
| `quest.ts` | Definições e estado de quests, marcadores |
| `items.ts` | Catálogo de itens, inventário, loot tables |
| `projectile.ts` | Projéteis de magia/flechas + partículas |
| `effects.ts` | Partículas (neve, explosões, rastros), números de dano flutuantes |
| `hud.ts` | HUD no canvas: barras, bússola, hotbar, joystick, botões touch |
| `ui.ts` | Ponte game→React para abrir menus (inventário, mapa, quests, diálogo, loja) |
| `save.ts` | Save/load em localStorage |
| `audio.ts` | Efeitos sonoros via WebAudio (procedural, sem arquivos) |
| `autopilot.ts` | Modo `?demo` determinístico para screenshots |

## Estado global do jogo
`GameState` único (player, world, quests, inventário, tempo) serializável para save.

## Contrato React ↔ Jogo
- `GameCanvas.tsx` cria o canvas, chama `createGameScene`, expõe `dispose()`.
- O jogo emite eventos (`openDialog`, `openShop`, `openMenu`, `toast`) consumidos pelo React via callback registry.
- Menus (inventário/mapa/quests/diálogo/loja) são componentes React sobre o canvas (pausam o jogo).

## Render
- Câmera com lerp suave, zoom adaptativo (mobile: mais zoom).
- Tiles pré-renderizados em offscreen canvases (chunks de 16x16) para performance.
- Sprites procedurais desenhados em código (pixel-art programática) + texturas geradas onde fizer sentido (título, pergaminho, logo).

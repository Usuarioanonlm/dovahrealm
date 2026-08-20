# DovahRealm — Plano de Produção

RPG 2D de mundo aberto estilo Skyrim para mobile (touch-first), Canvas 2D + React, PWA instalável.

## Escopo "tudo que tem no Skyrim" (versão 2D de bolso)

| Sistema | Implementação |
|---|---|
| Mundo aberto | Mapa 96x96 tiles com biomas (neve, floresta, montanha, rio, planície), vilas, ruínas, cavernas |
| Exploração | Descoberta de locais (fast travel no mapa), bússola com marcadores |
| Combate | Espada (melee), arco (flechas), magia (fogo/gelo/cura), gritos (Fus Ro Dah = empurrão + dano em cone) |
| Inimigos | Lobo, bandido, draugr, aranha, espectro de gelo, dragão (boss) |
| NPCs | Diálogos, lojistas (comprar/vender), quest-givers |
| Quests | Principal (matar o dragão) + secundárias (caçar lobos, recuperar artefato, limpar ruína) |
| Inventário | Armas, armaduras, poções, itens de quest; equipar/usar/descartar |
| Progressão | XP, níveis, atributos (vida/magicka/stamina), perks simples |
| Lojas/ouro | Economia com ouro, comprar/vender |
| Save | localStorage (salvar/carregar automático) |
| Mobile | Joystick virtual, botões de ação, PWA instalável |

## Fatias de risco (fazer primeiro)
1. **R1 — Render do mundo + câmera + movimento** (tilemap grande, colisão, joystick touch). Critério: screenshot mostra mundo renderizado e herói se move com joystick.
2. **R2 — Combate melee + inimigos com IA** (aggro, perseguição, ataque, morte, loot). Critério: screenshot com inimigo perseguindo e número de dano.
3. **R3 — Magia/projéteis + partículas**. Critério: screenshot com projétil de fogo e explosão.
4. **R4 — UI grimório (inventário/mapa/quests) + diálogos**. Critério: screenshots das 4 telas.

## Build principal
- Mundo procedural com locais fixos (vilas, ruínas, caverna do dragão)
- Ciclo dia/noite, neve caindo
- Save/load, PWA manifest, tela de título
- Modo `?demo` com autopilot para verificação por screenshot

## Verificação
- `pnpm check` sem erros
- Screenshots: título, gameplay, combate, inventário, mapa, diálogo
- Entrega: checkpoint + Publish (site jogável) + ZIP do código-fonte

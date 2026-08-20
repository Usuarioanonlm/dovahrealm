# DovahRealm — RPG 2D de Mundo Aberto

Um RPG 2D de mundo aberto inspirado em Skyrim, feito para **mobile** e jogável direto no navegador. Explore o norte congelado, lute com aço e magia, complete missões e derrote o dragão **Alduin**.

## Jogar

O jogo é publicado automaticamente via **GitHub Pages** a cada push na branch `main`:

**https://usuarioanonlm.github.io/dovahrealm/**

No celular, abra o link e use "Adicionar à tela inicial" para instalar como app (PWA).

## Recursos

- **Mundo aberto** 96×96 tiles: vilas, ruínas, cavernas, santuário, acampamento de bandidos
- **Combate**: espadas, machados, adagas, arco e flecha com mira automática
- **Magia**: bola de fogo, estilhaço de gelo, cura — e o grito **FUS RO DAH**
- **Inimigos**: lobos, bandidos, draugr, aranhas, espectros + chefe dragão Alduin
- **Quests**: 1 linha principal + 3 secundárias com diário de missões
- **NPCs**: 8 personagens com diálogos e 3 lojas (ferreiro, mercador, maga)
- **Progressão**: XP, níveis, ouro, inventário, equipamentos, save automático
- **Mobile-first**: joystick virtual, botões de ação, PWA instalável
- **Desktop**: WASD + Espaço (atacar), K (magia), L (grito), E (interagir), I/M/Q/C (menus)

## Rodar localmente

```bash
pnpm install
pnpm dev
```

Build de produção:

```bash
pnpm build
```

## Tecnologias

React 19 · TypeScript · Vite · Canvas 2D (pixel-art procedural) · Tailwind CSS 4 · Web Audio API

## Estrutura

```
client/src/game/     ← motor do jogo (mundo, entidades, combate, quests, HUD)
client/src/components/ ← telas e menus (título, inventário, mapa, diálogo, loja)
```

Documentação de design em `ideas.md`, plano em `PLAN.md`, arquitetura em `STRUCTURE.md`.

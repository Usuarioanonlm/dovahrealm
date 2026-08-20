# DovahRealm — Manifesto de Assets

Assets gerados via geração de imagem integrada. URLs `/manus-storage/...` são estáveis e atreladas ao projeto.

| Asset | URL | Uso |
|---|---|---|
| Visual target (mundo) | `/manus-storage/visual-target-world_336cfea8.png` | Referência de direção de arte |
| Logo dragão (transparente) | `/manus-storage/logo-dragon_043d8df9.png` | Header, favicon, tela de título |
| Herói spritesheet | `/manus-storage/hero-spritesheet_708232da.png` | Referência visual do herói (sprites finais são procedurais para animação por frames) |
| Inimigos spritesheet | `/manus-storage/enemies-spritesheet_b0704ce9.png` | Referência visual dos inimigos |
| NPCs spritesheet | `/manus-storage/npcs-spritesheet_53eb6944.png` | Referência visual dos NPCs |
| Itens spritesheet | `/manus-storage/items-spritesheet_328135ba.png` | Referência visual dos ícones de itens |
| Tileset mundo | `/manus-storage/tileset-world_73fd41f6.png` | Referência visual dos tiles |
| Pergaminho (UI) | `/manus-storage/parchment-texture_cb2119f1.png` | Fundo dos menus grimório |
| Título hero | `/manus-storage/title-hero_2edac150.png` | Tela de título |

## Decisão técnica
Sprites de gameplay (herói, inimigos, NPCs, tiles) são desenhados **proceduralmente em código** (pixel-art programática em offscreen canvases) para garantir animação por frames, variações de cor e performance em mobile. As imagens geradas servem como direção de arte e são usadas diretamente na tela de título, logo, pergaminho da UI e favicon.

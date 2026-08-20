// DovahRealm — página do jogo: canvas + overlays (título, menus, diálogo, loja, morte, vitória)
import { useCallback, useRef, useState } from "react";
import GameCanvas from "@/components/GameCanvas";
import TitleScreen from "@/components/TitleScreen";
import { GameOverScreen, VictoryScreen } from "@/components/EndScreens";
import {
  CharacterMenu,
  DialogMenu,
  InventoryMenu,
  MapMenu,
  QuestsMenu,
  ShopMenu,
} from "@/components/GameMenus";
import type { GameHandle } from "@/game/engine";
import type { UiEvent } from "@/game/types";

type Overlay =
  | { kind: "none" }
  | { kind: "title" }
  | { kind: "inventory" }
  | { kind: "map" }
  | { kind: "quests" }
  | { kind: "character" }
  | { kind: "dialog"; npcId: number }
  | { kind: "shop"; npcId: number }
  | { kind: "gameover" }
  | { kind: "victory" };

export default function GamePage() {
  const gameRef = useRef<GameHandle | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({ kind: "title" });

  const onReady = useCallback((h: GameHandle) => {
    gameRef.current = h;
    h.onUiEvent((e: UiEvent) => {
      if (e.type === "openMenu") setOverlay({ kind: e.menu });
      else if (e.type === "openDialog") setOverlay({ kind: "dialog", npcId: e.npcId });
      else if (e.type === "openShop") setOverlay({ kind: "shop", npcId: e.npcId });
      else if (e.type === "gameOver") setOverlay({ kind: "gameover" });
      else if (e.type === "victory") setOverlay({ kind: "victory" });
    });
    // modo demo para verificação por screenshot
    const params = new URLSearchParams(window.location.search);
    if (params.has("demo")) {
      h.performAction("newGame");
      setOverlay({ kind: "none" });
      const loc = params.get("loc");
      if (loc) {
        const [lx, ly] = loc.split(",").map(Number);
        if (!Number.isNaN(lx) && !Number.isNaN(ly)) {
          setTimeout(() => h.performAction("teleport", { x: lx, y: ly }), 300);
        }
      }
      const quest = params.get("quest");
      if (quest) h.performAction("activateQuest", quest);
      const menu = params.get("menu");
      if (menu) {
        setTimeout(() => {
          if (menu === "inventory" || menu === "map" || menu === "quests" || menu === "character") {
            setOverlay({ kind: menu });
          }
          h.performAction("pause");
        }, 600);
      }
    }
  }, []);

  const close = useCallback(() => {
    setOverlay({ kind: "none" });
    gameRef.current?.closeMenu();
  }, []);

  const state = gameRef.current?.getState();
  const dialogNpc = overlay.kind === "dialog" || overlay.kind === "shop" ? state?.npcs.find((n) => n.id === overlay.npcId) : undefined;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#101820]">
      <GameCanvas onReady={onReady} />

      {overlay.kind === "title" && (
        <TitleScreen
          onNewGame={() => {
            gameRef.current?.performAction("newGame");
            setOverlay({ kind: "none" });
          }}
          onContinue={() => {
            gameRef.current?.performAction("continue");
            setOverlay({ kind: "none" });
          }}
        />
      )}

      {overlay.kind === "inventory" && gameRef.current && <InventoryMenu game={gameRef.current} onClose={close} />}
      {overlay.kind === "map" && gameRef.current && <MapMenu game={gameRef.current} onClose={close} />}
      {overlay.kind === "quests" && gameRef.current && <QuestsMenu game={gameRef.current} onClose={close} />}
      {overlay.kind === "character" && gameRef.current && <CharacterMenu game={gameRef.current} onClose={close} />}

      {overlay.kind === "dialog" && dialogNpc && gameRef.current && (
        <DialogMenu
          game={gameRef.current}
          npc={dialogNpc}
          onClose={close}
          onOpenShop={() => setOverlay({ kind: "shop", npcId: dialogNpc.id })}
        />
      )}
      {overlay.kind === "shop" && dialogNpc && gameRef.current && <ShopMenu game={gameRef.current} npc={dialogNpc} onClose={close} />}

      {overlay.kind === "gameover" && (
        <GameOverScreen
          onRespawn={() => {
            gameRef.current?.performAction("respawn");
            setOverlay({ kind: "none" });
          }}
          onTitle={() => {
            gameRef.current?.performAction("respawn");
            setOverlay({ kind: "title" });
          }}
        />
      )}
      {overlay.kind === "victory" && (
        <VictoryScreen
          onContinue={() => {
            gameRef.current?.closeMenu();
            setOverlay({ kind: "none" });
          }}
        />
      )}
    </div>
  );
}

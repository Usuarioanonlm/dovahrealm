// DovahRealm — menus do grimório: inventário, mapa, quests, personagem, diálogo, loja
// Estilo: pergaminho com bordas rúnicas, bronze #b08d3f (ver ideas.md)
import { useEffect, useMemo, useState } from "react";
import type { GameHandle } from "@/game/engine";
import { ITEMS, SPELLS } from "@/game/items";
import { DIALOGS, SHOPS } from "@/game/npc";
import { itemIcon } from "@/game/sprites";
import { TILE, WORLD_H, WORLD_W, generateWorld } from "@/game/world";
import { learnSpell, removeItem, addItem, gainXp } from "@/game/player";
import { addToast } from "@/game/effects";
import { sfx } from "@/game/audio";
import type { Npc } from "@/game/types";

const PARCHMENT = "/manus-storage/parchment-texture_cb2119f1.png";

function GrimoirePage({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className={`relative max-h-[92vh] w-full overflow-hidden rounded-sm border-2 border-[#b08d3f] shadow-[0_0_60px_rgba(0,0,0,0.8)] ${wide ? "max-w-2xl" : "max-w-md"}`}
        style={{
          backgroundImage: `url(${PARCHMENT})`,
          backgroundSize: "cover",
          animation: "pageIn 240ms cubic-bezier(0.23,1,0.32,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 rounded-sm shadow-[inset_0_0_40px_rgba(43,29,14,0.45)]" />
        <div className="relative flex items-center justify-between border-b-2 border-[#b08d3f]/60 px-5 py-3">
          <h2 className="font-display text-xl font-bold tracking-wide text-[#2b1d0e]">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8e2f22] bg-[#8e2f22] text-lg text-[#e8d5a8] shadow-md transition-transform duration-150 active:scale-95"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="relative max-h-[calc(92vh-64px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function IconImg({ icon, size = 40 }: { icon: string; size?: number }) {
  const url = useMemo(() => itemIcon(icon).toDataURL(), [icon]);
  return <img src={url} width={size} height={size} style={{ imageRendering: "pixelated" }} alt="" />;
}

// ---------------- Inventário ----------------
export function InventoryMenu({ game, onClose }: { game: GameHandle; onClose: () => void }) {
  const [, force] = useState(0);
  const state = game.getState();
  const p = state.player;

  const use = (itemId: string) => {
    const def = ITEMS[itemId];
    if (!def) return;
    if (def.type === "weapon") {
      p.weaponId = itemId;
      addToast(state.toasts, `${def.name} equipada`);
    } else if (def.type === "armor") {
      p.armorId = itemId;
      addToast(state.toasts, `${def.name} equipada`);
    } else if (def.type === "potion") {
      if (def.heal) p.hp = Math.min(p.maxHp, p.hp + def.heal);
      if (def.magicka) p.mp = Math.min(p.maxMp, p.mp + def.magicka);
      if (def.stamina) p.sp = Math.min(p.maxSp, p.sp + def.stamina);
      removeItem(p, itemId, 1);
      sfx.heal();
    } else if (def.type === "tome" && def.spell) {
      if (learnSpell(p, def.spell)) {
        addToast(state.toasts, `Magia aprendida: ${SPELLS[def.spell].name}!`);
        removeItem(p, itemId, 1);
        sfx.quest();
      } else {
        addToast(state.toasts, "Você já conhece esta magia");
      }
    }
    force((x) => x + 1);
  };

  const drop = (itemId: string) => {
    const def = ITEMS[itemId];
    if (def?.type === "quest") return;
    removeItem(p, itemId, 1);
    force((x) => x + 1);
  };

  return (
    <GrimoirePage title="Inventário" onClose={onClose} wide>
      <div className="mb-3 flex items-center justify-between text-[#2b1d0e]">
        <span className="font-semibold">◉ {p.gold} de ouro</span>
        <span className="text-sm italic">{p.inventory.length} tipos de item</span>
      </div>
      <div className="space-y-2">
        {p.inventory.length === 0 && <p className="italic text-[#5c3a21]">Sua mochila está vazia como uma tumba saqueada.</p>}
        {p.inventory.map((slot) => {
          const def = ITEMS[slot.itemId];
          if (!def) return null;
          const equipped = p.weaponId === slot.itemId || p.armorId === slot.itemId;
          return (
            <div key={slot.itemId} className="flex items-center gap-3 rounded-sm border border-[#5c3a21]/40 bg-[#2b1d0e]/5 p-2">
              <IconImg icon={def.icon} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#2b1d0e]">{def.name}</span>
                  {slot.qty > 1 && <span className="text-sm text-[#5c3a21]">×{slot.qty}</span>}
                  {equipped && (
                    <span className="rounded-sm bg-[#b08d3f] px-1.5 text-[10px] font-bold uppercase tracking-wide text-[#2b1d0e]">Equipado</span>
                  )}
                </div>
                <p className="truncate text-xs italic text-[#5c3a21]">{def.desc}</p>
                <div className="mt-0.5 text-[11px] font-semibold text-[#8e2f22]">
                  {def.dmg ? `Dano ${def.dmg} · ` : ""}
                  {def.armor ? `Armadura ${def.armor} · ` : ""}
                  {def.price > 0 ? `${def.price} ouro` : "Item de missão"}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {(def.type === "weapon" || def.type === "armor") && !equipped && (
                  <button onClick={() => use(slot.itemId)} className="rounded-sm border border-[#5c3a21] bg-[#5c3a21] px-3 py-1.5 text-xs font-bold text-[#e8d5a8] transition-transform active:scale-95">
                    Equipar
                  </button>
                )}
                {def.type === "potion" && (
                  <button onClick={() => use(slot.itemId)} className="rounded-sm border border-[#3a7a4a] bg-[#3a7a4a] px-3 py-1.5 text-xs font-bold text-[#e8d5a8] transition-transform active:scale-95">
                    Usar
                  </button>
                )}
                {def.type === "tome" && (
                  <button onClick={() => use(slot.itemId)} className="rounded-sm border border-[#6b4a8a] bg-[#6b4a8a] px-3 py-1.5 text-xs font-bold text-[#e8d5a8] transition-transform active:scale-95">
                    Ler
                  </button>
                )}
                {def.type !== "quest" && !equipped && (
                  <button onClick={() => drop(slot.itemId)} className="rounded-sm border border-[#5c3a21]/50 px-3 py-1 text-[11px] text-[#5c3a21] transition-transform active:scale-95">
                    Soltar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 border-t border-[#5c3a21]/30 pt-3">
        <h3 className="mb-2 font-display text-sm font-bold text-[#2b1d0e]">Magias conhecidas</h3>
        <div className="flex flex-wrap gap-2">
          {p.spells.map((sid) => {
            const s = SPELLS[sid];
            const active = p.spell === sid;
            return (
              <button
                key={sid}
                onClick={() => {
                  game.performAction("setSpell", sid);
                  force((x) => x + 1);
                }}
                className={`rounded-sm border px-3 py-1.5 text-xs font-bold transition-transform active:scale-95 ${active ? "border-[#b08d3f] bg-[#b08d3f] text-[#2b1d0e]" : "border-[#5c3a21]/50 text-[#5c3a21]"}`}
              >
                ✦ {s.name}
              </button>
            );
          })}
        </div>
      </div>
    </GrimoirePage>
  );
}

// ---------------- Mapa ----------------
export function MapMenu({ game, onClose }: { game: GameHandle; onClose: () => void }) {
  const state = game.getState();
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    const W = 480;
    const H = 480;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    const colors: Record<string, string> = {
      snow: "#cfdce6",
      grass: "#5a6b4a",
      forest: "#1e3328",
      deadtree: "#8a939e",
      rock: "#4a4e55",
      water: "#1d3a4d",
      ice: "#a8c8d8",
      path: "#8a7350",
      floor: "#7a7f86",
      wall: "#3e4248",
      bridge: "#6b4a2a",
      door: "#b08d3f",
    };
    const w = generateWorld();
    const sx = W / WORLD_W;
    const sy = H / WORLD_H;
    for (let y = 0; y < WORLD_H; y++) {
      for (let x = 0; x < WORLD_W; x++) {
        g.fillStyle = colors[w.tiles[y * WORLD_W + x]] ?? "#ff00ff";
        g.fillRect(x * sx, y * sy, Math.ceil(sx), Math.ceil(sy));
      }
    }
    for (const loc of state.locations) {
      if (!loc.discovered) continue;
      g.fillStyle = loc.kind === "village" ? "#3a7a4a" : loc.kind === "cave" ? "#8e2f22" : "#2f5a8e";
      g.beginPath();
      g.arc(loc.x * sx, loc.y * sy, 6, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#e8d5a8";
      g.lineWidth = 1.5;
      g.stroke();
    }
    g.fillStyle = "#e8c23a";
    g.beginPath();
    g.arc((state.player.x / TILE) * sx, (state.player.y / TILE) * sy, 5, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#2b1d0e";
    g.stroke();
    setImg(c.toDataURL());
  }, [state]);

  return (
    <GrimoirePage title="Mapa do Norte" onClose={onClose} wide>
      {img ? (
        <img src={img} className="w-full rounded-sm border-2 border-[#5c3a21]/50" style={{ imageRendering: "pixelated" }} alt="Mapa" />
      ) : (
        <p className="italic text-[#5c3a21]">Desenrolando o mapa...</p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-[#2b1d0e]">
        {state.locations
          .filter((l) => l.discovered)
          .map((l) => (
            <div key={l.id} className="flex items-center gap-2">
              <span className={l.kind === "village" ? "text-[#3a7a4a]" : l.kind === "cave" ? "text-[#8e2f22]" : "text-[#2f5a8e]"}>●</span>
              <span className="font-semibold">{l.name}</span>
            </div>
          ))}
      </div>
      <p className="mt-2 text-[11px] italic text-[#5c3a21]">Explore o mundo para revelar novos locais no mapa. Dia {state.day} no norte.</p>
    </GrimoirePage>
  );
}

// ---------------- Quests ----------------
export function QuestsMenu({ game, onClose }: { game: GameHandle; onClose: () => void }) {
  const state = game.getState();
  const quests = state.quests.filter((q) => q.state !== "available");
  return (
    <GrimoirePage title="Diário de Missões" onClose={onClose} wide>
      {quests.length === 0 && (
        <p className="italic text-[#5c3a21]">
          Nenhuma missão ainda. Fale com os habitantes de Riofrio — pessoas com "!" acima da cabeça têm trabalho para você.
        </p>
      )}
      <div className="space-y-4">
        {quests.map((q) => (
          <div key={q.id} className="rounded-sm border border-[#5c3a21]/40 bg-[#2b1d0e]/5 p-3">
            <div className="flex items-center gap-2">
              {q.isMain && <span className="rounded-sm bg-[#8e2f22] px-1.5 text-[10px] font-bold uppercase text-[#e8d5a8]">Principal</span>}
              <h3 className="font-display font-bold text-[#2b1d0e]">{q.name}</h3>
              {q.state === "turned" && <span className="ml-auto text-xs font-bold text-[#3a7a4a]">✓ Concluída</span>}
            </div>
            <p className="mt-1 text-xs italic text-[#5c3a21]">{q.desc}</p>
            <ul className="mt-2 space-y-1">
              {q.objectives.map((o, i) => (
                <li key={i} className={`flex items-center gap-2 text-sm ${o.done ? "text-[#3a7a4a] line-through" : "text-[#2b1d0e]"}`}>
                  <span>{o.done ? "☑" : "☐"}</span>
                  <span>
                    {o.text}
                    {o.targetCount ? ` (${o.count ?? 0}/${o.targetCount})` : ""}
                  </span>
                </li>
              ))}
            </ul>
            {q.state === "active" && q.objectives.every((o) => o.done) && (
              <p className="mt-2 text-xs font-bold text-[#b08d3f]">Volte a {q.giver} para receber sua recompensa.</p>
            )}
          </div>
        ))}
      </div>
    </GrimoirePage>
  );
}

// ---------------- Personagem ----------------
export function CharacterMenu({ game, onClose }: { game: GameHandle; onClose: () => void }) {
  const state = game.getState();
  const p = state.player;
  const weapon = p.weaponId ? ITEMS[p.weaponId] : null;
  const armor = p.armorId ? ITEMS[p.armorId] : null;
  const killNames: Record<string, string> = {
    wolf: "Lobos",
    bandit: "Bandidos",
    draugr: "Draugr",
    spider: "Aranhas",
    wraith: "Espectros",
    dragon: "Dragões",
  };
  const rows: [string, string][] = [
    ["Nível", `${p.level} (${p.xp}/${p.xpNext} XP)`],
    ["Vida", `${Math.ceil(p.hp)} / ${p.maxHp}`],
    ["Magicka", `${Math.ceil(p.mp)} / ${p.maxMp}`],
    ["Stamina", `${Math.ceil(p.sp)} / ${p.maxSp}`],
    ["Arma", weapon ? `${weapon.name} (${weapon.dmg} dano)` : "Punhos"],
    ["Armadura", armor ? `${armor.name} (${armor.armor})` : "Roupas de viajante"],
    ["Ouro", `${p.gold}`],
    ["Dias no norte", `${state.day}`],
  ];
  return (
    <GrimoirePage title="O Dovahkiin" onClose={onClose}>
      <div className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-[#5c3a21]/20 pb-1 text-sm">
            <span className="font-semibold text-[#5c3a21]">{k}</span>
            <span className="font-bold text-[#2b1d0e]">{v}</span>
          </div>
        ))}
      </div>
      <h3 className="mb-2 mt-4 font-display text-sm font-bold text-[#2b1d0e]">Abates</h3>
      <div className="grid grid-cols-2 gap-1 text-xs text-[#2b1d0e]">
        {Object.entries(state.kills).map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span>{killNames[k] ?? k}</span>
            <span className="font-bold">{v}</span>
          </div>
        ))}
        {Object.keys(state.kills).length === 0 && <p className="italic text-[#5c3a21]">Nenhuma criatura abatida ainda.</p>}
      </div>
    </GrimoirePage>
  );
}

// ---------------- Diálogo ----------------
export function DialogMenu({
  game,
  npc,
  onClose,
  onOpenShop,
}: {
  game: GameHandle;
  npc: Npc;
  onClose: () => void;
  onOpenShop: () => void;
}) {
  const [, force] = useState(0);
  const state = game.getState();
  const dialog = DIALOGS[npc.dialogId];
  const [lineIdx, setLineIdx] = useState(0);
  const quest = npc.questId ? state.quests.find((q) => q.id === npc.questId) : undefined;
  const canAccept = quest && quest.state === "available";
  const canTurnIn = quest && quest.state === "active" && quest.objectives.every((o) => o.done);
  const line = dialog?.lines[Math.min(lineIdx, (dialog?.lines.length ?? 1) - 1)];

  const acceptQuest = () => {
    if (!quest) return;
    quest.state = "active";
    sfx.quest();
    addToast(state.toasts, `Missão aceita: ${quest.name}`);
    force((x) => x + 1);
  };

  const turnIn = () => {
    if (!quest) return;
    quest.state = "turned";
    const p = state.player;
    p.gold += quest.rewardGold;
    for (const o of quest.objectives) {
      if (o.itemId) removeItem(p, o.itemId, 1);
    }
    gainXp(state, quest.rewardXp);
    if (quest.rewardItemId) {
      addItem(p, quest.rewardItemId, 1);
      addToast(state.toasts, `Recompensa: ${ITEMS[quest.rewardItemId].name}`);
    }
    addToast(state.toasts, `Missão concluída: ${quest.name}`, `+${quest.rewardGold} ouro`);
    sfx.coin();
    force((x) => x + 1);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-lg overflow-hidden rounded-sm border-2 border-[#b08d3f] shadow-[0_0_40px_rgba(0,0,0,0.7)]"
        style={{ backgroundImage: `url(${PARCHMENT})`, backgroundSize: "cover", animation: "pageIn 220ms cubic-bezier(0.23,1,0.32,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#5c3a21]/40 px-4 py-2">
          <span className="font-display font-bold text-[#2b1d0e]">{npc.name}</span>
        </div>
        <div className="p-4">
          <p className="min-h-[3.5rem] text-sm leading-relaxed text-[#2b1d0e]">
            <span className="font-semibold text-[#5c3a21]">{line?.speaker}: </span>
            {line?.text}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lineIdx < (dialog?.lines.length ?? 1) - 1 && (
              <button
                onClick={() => setLineIdx(lineIdx + 1)}
                className="rounded-sm border border-[#5c3a21] bg-[#5c3a21] px-4 py-2 text-xs font-bold text-[#e8d5a8] transition-transform active:scale-95"
              >
                Continuar →
              </button>
            )}
            {canAccept && (
              <button
                onClick={acceptQuest}
                className="rounded-sm border border-[#b08d3f] bg-[#b08d3f] px-4 py-2 text-xs font-bold text-[#2b1d0e] transition-transform active:scale-95"
              >
                Aceitar missão: {quest.name}
              </button>
            )}
            {canTurnIn && (
              <button
                onClick={turnIn}
                className="rounded-sm border border-[#3a7a4a] bg-[#3a7a4a] px-4 py-2 text-xs font-bold text-[#e8d5a8] transition-transform active:scale-95"
              >
                Entregar missão (+{quest.rewardGold} ouro)
              </button>
            )}
            {npc.shopId && (
              <button
                onClick={onOpenShop}
                className="rounded-sm border border-[#2f5a8e] bg-[#2f5a8e] px-4 py-2 text-xs font-bold text-[#e8d5a8] transition-transform active:scale-95"
              >
                Ver mercadorias
              </button>
            )}
            <button onClick={onClose} className="rounded-sm border border-[#5c3a21]/50 px-4 py-2 text-xs text-[#5c3a21] transition-transform active:scale-95">
              Partir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Loja ----------------
export function ShopMenu({ game, npc, onClose }: { game: GameHandle; npc: Npc; onClose: () => void }) {
  const [, force] = useState(0);
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const state = game.getState();
  const p = state.player;
  const shop = npc.shopId ? SHOPS[npc.shopId] : undefined;

  const buy = (itemId: string) => {
    const def = ITEMS[itemId];
    if (!def || p.gold < def.price) {
      addToast(state.toasts, "Ouro insuficiente");
      return;
    }
    p.gold -= def.price;
    addItem(p, itemId, 1);
    addToast(state.toasts, `Comprou ${def.name}`);
    sfx.coin();
    force((x) => x + 1);
  };

  const sell = (itemId: string) => {
    const def = ITEMS[itemId];
    if (!def || def.type === "quest") return;
    if (p.weaponId === itemId || p.armorId === itemId) return;
    const price = Math.max(1, Math.floor(def.price * 0.5));
    removeItem(p, itemId, 1);
    p.gold += price;
    sfx.coin();
    force((x) => x + 1);
  };

  const sellable = p.inventory.filter((s) => {
    const def = ITEMS[s.itemId];
    return def && def.type !== "quest" && p.weaponId !== s.itemId && p.armorId !== s.itemId;
  });

  return (
    <GrimoirePage title={shop?.name ?? "Loja"} onClose={onClose} wide>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("buy")}
            className={`rounded-sm border px-4 py-1.5 text-xs font-bold ${tab === "buy" ? "border-[#b08d3f] bg-[#b08d3f] text-[#2b1d0e]" : "border-[#5c3a21]/50 text-[#5c3a21]"}`}
          >
            Comprar
          </button>
          <button
            onClick={() => setTab("sell")}
            className={`rounded-sm border px-4 py-1.5 text-xs font-bold ${tab === "sell" ? "border-[#b08d3f] bg-[#b08d3f] text-[#2b1d0e]" : "border-[#5c3a21]/50 text-[#5c3a21]"}`}
          >
            Vender
          </button>
        </div>
        <span className="font-semibold text-[#2b1d0e]">◉ {p.gold}</span>
      </div>
      <div className="space-y-2">
        {tab === "buy" &&
          shop?.stock.map((itemId) => {
            const def = ITEMS[itemId];
            return (
              <div key={itemId} className="flex items-center gap-3 rounded-sm border border-[#5c3a21]/40 bg-[#2b1d0e]/5 p-2">
                <IconImg icon={def.icon} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#2b1d0e]">{def.name}</div>
                  <p className="truncate text-xs italic text-[#5c3a21]">{def.desc}</p>
                </div>
                <button
                  onClick={() => buy(itemId)}
                  disabled={p.gold < def.price}
                  className="rounded-sm border border-[#3a7a4a] bg-[#3a7a4a] px-3 py-1.5 text-xs font-bold text-[#e8d5a8] transition-transform active:scale-95 disabled:opacity-40"
                >
                  ◉ {def.price}
                </button>
              </div>
            );
          })}
        {tab === "sell" &&
          sellable.map((slot) => {
            const def = ITEMS[slot.itemId];
            return (
              <div key={slot.itemId} className="flex items-center gap-3 rounded-sm border border-[#5c3a21]/40 bg-[#2b1d0e]/5 p-2">
                <IconImg icon={def.icon} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#2b1d0e]">
                    {def.name} {slot.qty > 1 && <span className="text-sm text-[#5c3a21]">×{slot.qty}</span>}
                  </div>
                </div>
                <button
                  onClick={() => sell(slot.itemId)}
                  className="rounded-sm border border-[#8e2f22] bg-[#8e2f22] px-3 py-1.5 text-xs font-bold text-[#e8d5a8] transition-transform active:scale-95"
                >
                  ◉ {Math.max(1, Math.floor(def.price * 0.5))}
                </button>
              </div>
            );
          })}
        {tab === "sell" && sellable.length === 0 && <p className="italic text-[#5c3a21]">Nada para vender.</p>}
      </div>
    </GrimoirePage>
  );
}

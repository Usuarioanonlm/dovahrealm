// DovahRealm — save/load em localStorage
import type { GameState } from "./types";

const KEY = "dovahrealm_save_v1";

export function saveGame(state: GameState) {
  try {
    const data = {
      player: state.player,
      quests: state.quests,
      locations: state.locations,
      timeOfDay: state.timeOfDay,
      day: state.day,
      kills: state.kills,
      dragonDefeated: state.dragonDefeated,
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.player) return null;
    return data;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

import { createInitialState } from '../state/initialState';
import { migrateState } from './migrations';
import { STORAGE_KEY, type AppState } from './schema';

export function loadState(storage?: Storage): AppState {
  try {
    const resolvedStorage = storage ?? globalThis.localStorage;
    if (!resolvedStorage) return createInitialState();
    const raw = resolvedStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    return migrateState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
}

export function saveState(
  state: AppState,
  storage?: Storage,
): void {
  try {
    const resolvedStorage = storage ?? globalThis.localStorage;
    if (!resolvedStorage) return;
    resolvedStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable, full, or blocked; state remains in memory.
  }
}

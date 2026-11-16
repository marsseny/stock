import { useSyncExternalStore } from 'react';

/**
 * Site-wide sound preference for every video preview (cards, product page).
 * Once a visitor turns sound on in any preview it stays on for all other previews and pages;
 * once they mute it, it stays muted. Persisted in sessionStorage for the current visit.
 */

const KEY = 'framehaus:sound';
const listeners = new Set<() => void>();

let soundOn = (() => {
  try {
    return sessionStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
})();

export function setSoundOn(next: boolean) {
  if (next === soundOn) return;
  soundOn = next;
  try {
    sessionStorage.setItem(KEY, next ? 'on' : 'off');
  } catch {
    /* storage unavailable — keep in memory only */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSoundOn() {
  return useSyncExternalStore(subscribe, () => soundOn, () => false);
}

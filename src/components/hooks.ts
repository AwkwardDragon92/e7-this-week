"use client";
import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** false during SSR/hydration, true after. */
export function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
function subscribeTick(cb: () => void) {
  listeners.add(cb);
  if (!timer) timer = setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Current time (to the second) on the client; null on the server. */
export function useNow() {
  return useSyncExternalStore(subscribeTick, () => Math.floor(Date.now() / 1000) * 1000, () => null);
}

export function useLocalStorageFlag(key: string) {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => true,
  );
}

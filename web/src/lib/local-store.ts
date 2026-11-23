"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny store saved in localStorage and shared across components and browser tabs.
 * Used for the bag, saved items and recently viewed products.
 */
export function createLocalStore<T>(key: string, initial: T, validate: (value: unknown) => T) {
  let state: T = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = validate(JSON.parse(raw));
    } catch {
      state = initial;
    }
    window.addEventListener("storage", (e) => {
      if (e.key !== key) return;
      try {
        state = e.newValue ? validate(JSON.parse(e.newValue)) : initial;
      } catch {
        state = initial;
      }
      listeners.forEach((l) => l());
    });
  }

  function get(): T {
    load();
    return state;
  }

  function set(update: T | ((prev: T) => T)) {
    load();
    state = typeof update === "function" ? (update as (prev: T) => T)(state) : update;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Private mode or full storage: keep working in memory.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, get, () => initial);
  }

  return { get, set, useStore };
}

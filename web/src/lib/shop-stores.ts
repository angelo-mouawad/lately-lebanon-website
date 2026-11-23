"use client";

import { useSyncExternalStore } from "react";
import type { PublicProductCard } from "@latelylebanon/shared";
import { createLocalStore } from "./local-store";

/* ---------- Bag ---------- */

export interface CartLine {
  variantId: number;
  quantity: number;
  /** Shown straight away; prices are always re-checked with the API before checkout. */
  productName: string;
  productSlug: string;
  brandName: string;
  variantLabel: string;
  priceCents: number;
  imageUrl: string | null;
  maxQuantity: number;
}

const MAX_PER_LINE = 20;

function isLine(v: unknown): v is CartLine {
  if (!v || typeof v !== "object") return false;
  const l = v as Record<string, unknown>;
  return typeof l.variantId === "number" && typeof l.quantity === "number" && typeof l.productName === "string";
}

export const cartStore = createLocalStore<CartLine[]>("ll_cart", [], (v) => (Array.isArray(v) ? v.filter(isLine) : []));

export const useCart = cartStore.useStore;

export function addToCart(line: Omit<CartLine, "quantity">, quantity: number) {
  cartStore.set((lines) => {
    const existing = lines.find((l) => l.variantId === line.variantId);
    const cap = Math.min(MAX_PER_LINE, line.maxQuantity);
    if (existing) {
      return lines.map((l) =>
        l.variantId === line.variantId ? { ...l, ...line, quantity: Math.min(cap, l.quantity + quantity) } : l,
      );
    }
    return [...lines, { ...line, quantity: Math.min(cap, quantity) }];
  });
}

export function setCartQuantity(variantId: number, quantity: number) {
  cartStore.set((lines) =>
    quantity <= 0
      ? lines.filter((l) => l.variantId !== variantId)
      : lines.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_PER_LINE, l.maxQuantity, quantity) } : l)),
  );
}

export function removeFromCart(variantId: number) {
  cartStore.set((lines) => lines.filter((l) => l.variantId !== variantId));
}

export function clearCart() {
  cartStore.set([]);
}

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);

/* ---------- Saved for later and recently viewed ---------- */

function isCard(v: unknown): v is PublicProductCard {
  return Boolean(v && typeof v === "object" && typeof (v as PublicProductCard).slug === "string");
}

const cardList = (v: unknown) => (Array.isArray(v) ? v.filter(isCard) : []);

export const wishlistStore = createLocalStore<PublicProductCard[]>("ll_saved", [], cardList);
export const useWishlist = wishlistStore.useStore;

export function toggleWishlist(card: PublicProductCard) {
  wishlistStore.set((list) => (list.some((c) => c.id === card.id) ? list.filter((c) => c.id !== card.id) : [card, ...list].slice(0, 60)));
}

export const recentStore = createLocalStore<PublicProductCard[]>("ll_recent", [], cardList);
export const useRecent = recentStore.useStore;

export function rememberViewed(card: PublicProductCard) {
  recentStore.set((list) => [card, ...list.filter((c) => c.id !== card.id)].slice(0, 9));
}

/* ---------- Bag drawer ---------- */

let drawerOpen = false;
const drawerListeners = new Set<() => void>();

export const bagDrawer = {
  open() {
    drawerOpen = true;
    drawerListeners.forEach((l) => l());
  },
  close() {
    drawerOpen = false;
    drawerListeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    drawerListeners.add(l);
    return () => drawerListeners.delete(l);
  },
  get: () => drawerOpen,
};

export function useBagDrawerOpen(): boolean {
  return useSyncExternalStore(bagDrawer.subscribe, bagDrawer.get, () => false);
}

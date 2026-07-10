"use client";

import { useState, useCallback, useEffect } from "react";
import { CartItem, Product } from "@/types";

function storageKey(tableToken: string) {
  return `cart-${tableToken}`;
}

export function useCart(tableToken?: string) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (!tableToken) return [];
    try {
      const raw = localStorage.getItem(storageKey(tableToken));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    if (!tableToken) return;
    try {
      localStorage.setItem(storageKey(tableToken), JSON.stringify(items));
    } catch {}
  }, [items, tableToken]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, notes: "" }];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const updateNotes = useCallback((productId: number, notes: string) => {
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, notes } : i))
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    if (tableToken) {
      try { localStorage.removeItem(storageKey(tableToken)); } catch {}
    }
  }, [tableToken]);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, total, count, addItem, removeItem, updateQuantity, updateNotes, clear };
}

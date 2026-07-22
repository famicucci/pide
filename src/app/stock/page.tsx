"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Loader2,
  LogOut,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/ui/logo";
import type { StockItem, UserRole } from "@/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ItemsResponse {
  season: "low" | "high";
  date: string;
  items: StockItem[];
}

export default function StockPage() {
  const router = useRouter();
  const [data, setData] = useState<ItemsResponse | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [focusedQuantityId, setFocusedQuantityId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [statuses, setStatuses] = useState<Record<number, SaveStatus>>({});
  const savePointerItemId = useRef<number | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    item: StockItem;
    quantity: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [itemsRes, sessionRes] = await Promise.all([
        fetch("/api/stock/items"),
        fetch("/api/auth/session"),
      ]);
      if (!itemsRes.ok) throw new Error("No se pudo cargar el stock.");
      const payload = (await itemsRes.json()) as ItemsResponse;
      setData(payload);
      setQuantities(
        Object.fromEntries(payload.items.map((item) => [item.id, String(item.current_quantity)]))
      );
      if (sessionRes.ok) {
        const session = (await sessionRes.json()) as { role: UserRole };
        setRole(session.role);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudo cargar el stock.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => [...new Set(data?.items.map((item) => item.category_name) ?? [])],
    [data]
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return (data?.items ?? []).filter((item) => {
      const matchesCategory = category === "all" || item.category_name === category;
      const haystack = `${item.brand ?? ""} ${item.name}`.toLocaleLowerCase("es");
      return matchesCategory && (!term || haystack.includes(term));
    });
  }, [category, data, search]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, StockItem[]>();
    for (const item of filteredItems) {
      const group = groups.get(item.category_name) ?? [];
      group.push(item);
      groups.set(item.category_name, group);
    }
    return [...groups.entries()];
  }, [filteredItems]);

  async function saveItem(item: StockItem) {
    const rawQuantity = quantities[item.id]?.replace(",", ".");
    const quantity = Number(rawQuantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      setStatuses((current) => ({ ...current, [item.id]: "error" }));
      return;
    }

    const isUnusual =
      item.current_quantity > 0 &&
      (quantity >= item.current_quantity * 3 || quantity <= item.current_quantity * 0.2);
    if (isUnusual) {
      setPendingConfirmation({ item, quantity });
      return;
    }

    await persistItem(item, quantity);
  }

  async function persistItem(item: StockItem, quantity: number) {
    setStatuses((current) => ({ ...current, [item.id]: "saving" }));
    const response = await fetch(`/api/stock/items/${item.id}/quantity`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      setStatuses((current) => ({ ...current, [item.id]: "error" }));
      return;
    }

    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((currentItem) =>
              currentItem.id === item.id
                ? {
                    ...currentItem,
                    current_quantity: quantity,
                    is_low_stock:
                      currentItem.active_minimum !== null &&
                      currentItem.active_minimum !== undefined &&
                      quantity <= currentItem.active_minimum,
                  }
                : currentItem
            ),
          }
        : current
    );
    setStatuses((current) => ({ ...current, [item.id]: "saved" }));
    window.setTimeout(
      () => setStatuses((current) => ({ ...current, [item.id]: "idle" })),
      1800
    );
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {role === "admin" && (
              <Link
                href="/admin/stock"
                aria-label="Volver al panel"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <div>
              <Logo className="text-xl" />
              <p className="text-xs font-medium text-muted-foreground">Actualizar stock</p>
            </div>
          </div>
          <button
            onClick={logout}
            aria-label="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto max-w-3xl space-y-3 pb-3">
          <div className="px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar marca o producto"
                className="h-12 bg-muted/50 pl-10 text-base"
              />
            </div>
          </div>
          <div className="scrollbar-hide overflow-x-auto pb-1">
            <div className="flex w-max min-w-full gap-2 px-4">
              <button
                onClick={() => setCategory("all")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                  category === "all" ? "bg-primary text-white" : "bg-muted text-foreground"
                }`}
              >
                Todos
              </button>
              {categories.map((name) => (
                <button
                  key={name}
                  onClick={() => setCategory(name)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                    category === name ? "bg-primary text-white" : "bg-muted text-foreground"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border bg-white p-6 text-center">
            <TriangleAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <p className="font-semibold">{loadError}</p>
            <Button onClick={load} className="mt-4">Reintentar</Button>
          </div>
        ) : groupedItems.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-muted-foreground">
            <ClipboardCheck className="mx-auto mb-3 h-9 w-9" />
            <p>No encontramos artículos.</p>
          </div>
        ) : (
          groupedItems.map(([categoryName, items]) => (
            <section key={categoryName} className="space-y-3">
              <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {categoryName}
              </h2>
              {items.map((item) => {
                const value = quantities[item.id] ?? "";
                const parsedValue = Number(value.replace(",", "."));
                const changed =
                  Number.isFinite(parsedValue) && parsedValue !== item.current_quantity;
                const status = statuses[item.id] ?? "idle";

                return (
                  <article
                    key={item.id}
                    className={`relative rounded-2xl border bg-white p-4 shadow-sm ${
                      item.is_low_stock ? "border-amber-300" : ""
                    }`}
                  >
                    <div className="mb-3 min-w-0 pr-28">
                      {item.brand && (
                        <p className="truncate text-xs font-semibold uppercase tracking-wide text-primary">
                          {item.brand}
                        </p>
                      )}
                      <h3 className="text-base font-bold leading-tight">{item.name}</h3>
                    </div>
                    <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
                      <span
                        aria-label={`Unidad: ${item.unit_label}`}
                        title={item.unit_label}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {item.unit_abbreviation}
                      </span>
                      {item.is_low_stock && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          Stock bajo
                        </span>
                      )}
                    </div>

                    <div className="flex items-end gap-2">
                      <label className="min-w-0 flex-1">
                        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Cantidad actual
                          {focusedQuantityId === item.id ? `: ${item.current_quantity}` : ""}
                        </span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={value}
                          onFocus={() => {
                            setFocusedQuantityId(item.id);
                            setQuantities((current) => ({ ...current, [item.id]: "" }));
                            setStatuses((current) => ({ ...current, [item.id]: "idle" }));
                          }}
                          onBlur={(event) => {
                            setFocusedQuantityId(null);
                            const saveTarget =
                              event.relatedTarget instanceof HTMLElement &&
                              event.relatedTarget.dataset.stockSaveId === String(item.id);
                            const saveViaPointer = savePointerItemId.current === item.id;
                            savePointerItemId.current = null;

                            if (saveTarget || saveViaPointer) return;
                            setQuantities((current) => ({
                              ...current,
                              [item.id]: String(item.current_quantity),
                            }));
                            setStatuses((current) => ({ ...current, [item.id]: "idle" }));
                          }}
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="h-12 text-center text-xl font-bold"
                          aria-label={`Cantidad de ${item.name}`}
                        />
                      </label>
                      <Button
                        data-stock-save-id={item.id}
                        onPointerDown={() => {
                          savePointerItemId.current = item.id;
                        }}
                        onClick={() => saveItem(item)}
                        disabled={!changed || status === "saving" || parsedValue < 0}
                        className="h-12 w-28 shrink-0"
                      >
                        {status === "saving"
                          ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                                <span className="sr-only">Guardando</span>
                              </>
                            )
                          : status === "saved"
                            ? (
                                <>
                                  <Check className="h-5 w-5" aria-hidden="true" />
                                  <span className="sr-only">Guardado</span>
                                </>
                              )
                            : "Guardar"}
                      </Button>
                    </div>

                    {status === "error" && (
                      <p className="mt-2 text-sm font-medium text-destructive">
                        Revisá la cantidad e intentá nuevamente.
                      </p>
                    )}

                  </article>
                );
              })}
            </section>
          ))
        )}
      </main>

      <Dialog
        open={pendingConfirmation !== null}
        onOpenChange={(open) => {
          if (!open) setPendingConfirmation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <DialogTitle>Revisá la cantidad</DialogTitle>
          </DialogHeader>
          {pendingConfirmation && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Estás por cambiar{" "}
                <strong className="text-foreground">
                  {pendingConfirmation.item.brand
                    ? `${pendingConfirmation.item.brand} · `
                    : ""}
                  {pendingConfirmation.item.name}
                </strong>{" "}
                de{" "}
                <strong className="text-foreground">
                  {pendingConfirmation.item.current_quantity}{" "}
                  {pendingConfirmation.item.unit_abbreviation}
                </strong>{" "}
                a{" "}
                <strong className="text-foreground">
                  {pendingConfirmation.quantity}{" "}
                  {pendingConfirmation.item.unit_abbreviation}
                </strong>
                .
              </p>
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
                Diferencia:{" "}
                <strong>
                  {pendingConfirmation.quantity - pendingConfirmation.item.current_quantity > 0
                    ? "+"
                    : ""}
                  {Number(
                    (
                      pendingConfirmation.quantity -
                      pendingConfirmation.item.current_quantity
                    ).toFixed(2)
                  )}{" "}
                  {pendingConfirmation.item.unit_abbreviation}
                </strong>
              </div>
              <p className="text-sm font-medium">¿Querés continuar?</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingConfirmation(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!pendingConfirmation) return;
                const { item, quantity } = pendingConfirmation;
                setPendingConfirmation(null);
                void persistItem(item, quantity);
              }}
            >
              Sí, guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

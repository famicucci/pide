"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, CalendarRange, History, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getStockLocalDate } from "@/lib/stock";
import type { StockMovement } from "@/types";

interface MovementResponse {
  total: number;
  movements: StockMovement[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export default function StockHistoryPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [filterError, setFilterError] = useState("");

  const load = useCallback(async (offset = 0) => {
    const params = new URLSearchParams({ limit: "50", offset: String(offset) });
    if (appliedFrom) params.set("from", appliedFrom);
    if (appliedTo) params.set("to", appliedTo);
    const response = await fetch(`/api/stock/movements?${params}`);
    if (!response.ok) return;
    const payload = (await response.json()) as MovementResponse;
    setTotal(payload.total);
    setMovements((current) => (offset === 0 ? payload.movements : [...current, ...payload.movements]));
  }, [appliedFrom, appliedTo]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    await load(movements.length);
    setLoadingMore(false);
  }

  function applyRange(nextFrom = from, nextTo = to) {
    setFilterError("");
    if (!nextFrom || !nextTo || nextFrom > nextTo) {
      setFilterError("Elegí un rango de fechas válido.");
      return;
    }
    setFrom(nextFrom);
    setTo(nextTo);
    setLoading(true);
    setAppliedFrom(nextFrom);
    setAppliedTo(nextTo);
  }

  function applyQuickRange(days: number) {
    const today = getStockLocalDate();
    applyRange(shiftDate(today, -(days - 1)), today);
  }

  function clearRange() {
    setFrom("");
    setTo("");
    setFilterError("");
    setLoading(true);
    setAppliedFrom("");
    setAppliedTo("");
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="sr-only">Historial de stock</h1>
        <div className="mb-5 rounded-2xl border bg-white p-4">
          <button
            onClick={() => setFiltersOpen((current) => !current)}
            className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
          >
            <span className="flex items-center gap-2 font-semibold">
              <CalendarRange className="h-5 w-5 text-primary" />
              Filtrar por fecha
            </span>
            {appliedFrom && appliedTo ? (
              <span className="text-sm text-muted-foreground">
                {appliedFrom.split("-").reverse().join("/")} – {appliedTo.split("-").reverse().join("/")}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Todos</span>
            )}
          </button>

          {filtersOpen && (
            <div className="mt-4 border-t pt-4">
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => applyQuickRange(1)}
                  className="shrink-0 rounded-full bg-muted px-4 py-2 text-sm font-medium"
                >
                  Hoy
                </button>
                <button
                  onClick={() => applyQuickRange(7)}
                  className="shrink-0 rounded-full bg-muted px-4 py-2 text-sm font-medium"
                >
                  Últimos 7 días
                </button>
                <button
                  onClick={() => applyQuickRange(30)}
                  className="shrink-0 rounded-full bg-muted px-4 py-2 text-sm font-medium"
                >
                  Últimos 30 días
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="space-y-1">
                  <Label>Desde</Label>
                  <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                </label>
                <label className="space-y-1">
                  <Label>Hasta</Label>
                  <Input
                    type="date"
                    min={from}
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                  />
                </label>
                <Button onClick={() => applyRange()}>Aplicar</Button>
              </div>

              {filterError && <p className="mt-3 text-sm font-medium text-destructive">{filterError}</p>}
              {appliedFrom && appliedTo && (
                <button
                  onClick={clearRange}
                  className="mt-3 flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" /> Limpiar filtro
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : movements.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">
            <History className="mx-auto mb-3 h-9 w-9" />
            <p>
              {appliedFrom
                ? "No hay movimientos dentro del rango seleccionado."
                : "Todavía no hay movimientos de stock."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="px-1 text-sm text-muted-foreground">
              {total} {total === 1 ? "movimiento" : "movimientos"}
            </p>
            {movements.map((movement) => {
              const positive = movement.difference > 0;
              const negative = movement.difference < 0;
              return (
                <article key={movement.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {movement.item_brand ? `${movement.item_brand} · ` : ""}
                        {movement.unit_abbreviation}
                      </p>
                      <h2 className="font-bold">{movement.item_name}</h2>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
                        positive
                          ? "bg-emerald-100 text-emerald-800"
                          : negative
                            ? "bg-red-100 text-red-800"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {positive ? <ArrowUp className="h-3.5 w-3.5" /> : negative ? <ArrowDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                      {movement.difference > 0 ? "+" : ""}
                      {movement.difference}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span>
                      {movement.movement_type === "initial" ? (
                        <>Stock inicial: <strong>{movement.new_quantity}</strong></>
                      ) : (
                        <><strong>{movement.previous_quantity}</strong> → <strong>{movement.new_quantity}</strong></>
                      )}
                    </span>
                    <span className="text-muted-foreground">{movement.user_name}</span>
                    <span className="text-muted-foreground">{formatDate(movement.created_at)}</span>
                  </div>
                  {movement.notes && (
                    <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                      {movement.notes}
                    </p>
                  )}
                </article>
              );
            })}

            {movements.length < total && (
              <div className="pt-2 text-center">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Cargando..." : "Cargar más"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

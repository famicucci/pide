"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, History, Minus } from "lucide-react";
import { AdminStockNav } from "@/components/stock/AdminStockNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function StockHistoryPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (offset = 0) => {
    const response = await fetch(`/api/stock/movements?limit=50&offset=${offset}`);
    if (!response.ok) return;
    const payload = (await response.json()) as MovementResponse;
    setTotal(payload.total);
    setMovements((current) => (offset === 0 ? payload.movements : [...current, ...payload.movements]));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    await load(movements.length);
    setLoadingMore(false);
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <p className="text-sm text-muted-foreground">Auditoría de cambios</p>
          <h1 className="text-2xl font-bold">Historial de stock</h1>
        </div>

        <AdminStockNav />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : movements.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">
            <History className="mx-auto mb-3 h-9 w-9" />
            <p>Todavía no hay movimientos de stock.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {movements.map((movement) => {
              const positive = movement.difference > 0;
              const negative = movement.difference < 0;
              return (
                <article key={movement.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {movement.item_brand ? `${movement.item_brand} · ` : ""}
                        {movement.unit}
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

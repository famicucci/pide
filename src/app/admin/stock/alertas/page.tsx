"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, PackageOpen, TriangleAlert } from "lucide-react";
import { AdminStockNav } from "@/components/stock/AdminStockNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AlertItem {
  id: number;
  category_name: string;
  brand: string | null;
  name: string;
  unit: string;
  unit_abbreviation: string;
  current_quantity: number;
  active_minimum: number;
  shortage: number;
}

interface AlertsResponse {
  count: number;
  season: "low" | "high";
  date: string;
  items: AlertItem[];
}

export default function StockAlertsPage() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stock/alerts")
      .then((response) => response.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Control de mínimos</p>
            <h1 className="text-2xl font-bold">Alertas de stock</h1>
          </div>
          <Button asChild>
            <Link href="/stock">Actualizar stock</Link>
          </Button>
        </div>

        <AdminStockNav />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-700" />
            <h2 className="text-lg font-bold">Todo el stock está en orden</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No hay artículos por debajo del mínimo de temporada{" "}
              {data?.season === "high" ? "alta" : "baja"}.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-center gap-3">
                <TriangleAlert className="h-6 w-6 shrink-0 text-amber-800" />
                <div>
                  <p className="font-bold">
                    {data.count} {data.count === 1 ? "artículo necesita" : "artículos necesitan"} atención
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Mínimos de temporada {data.season === "high" ? "alta" : "baja"}.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {data.items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-amber-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {item.brand && (
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {item.brand}
                        </p>
                      )}
                      <h2 className="font-bold">{item.name}</h2>
                      <p className="text-xs text-muted-foreground">{item.category_name}</p>
                    </div>
                    <PackageOpen className="h-5 w-5 text-amber-700" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-muted/60 p-2">
                      <p className="text-[11px] text-muted-foreground">Actual</p>
                      <p className="font-bold">{item.current_quantity}</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-2">
                      <p className="text-[11px] text-muted-foreground">Mínimo</p>
                      <p className="font-bold">{item.active_minimum}</p>
                    </div>
                    <div className="rounded-xl bg-amber-100 p-2">
                      <p className="text-[11px] text-amber-900">Faltante</p>
                      <p className="font-bold text-amber-900">{item.shortage}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-right text-xs text-muted-foreground">
                    {item.unit_abbreviation}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

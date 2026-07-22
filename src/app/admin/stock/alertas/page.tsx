"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, PackageOpen, Printer, TriangleAlert } from "lucide-react";
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
    <>
      <div className="p-4 print:hidden sm:p-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="sr-only">Alertas de stock</h1>
          <div className="mb-5 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              disabled={!data?.items.length}
            >
              <Printer className="h-4 w-4" />
              Imprimir reporte
            </Button>
            <Button asChild>
              <Link href="/stock">Actualizar stock</Link>
            </Button>
          </div>

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

      {data && data.items.length > 0 && (
        <section className="stock-print-report hidden bg-white text-black print:block">
          <header className="mb-6 border-b-2 border-black pb-4">
            <p className="text-sm font-bold uppercase tracking-wider">La Cuadra · Pide</p>
            <h1 className="mt-1 text-2xl font-bold">Reporte de stock bajo</h1>
            <div className="mt-2 flex justify-between text-sm">
              <span>
                Fecha: {data.date.split("-").reverse().join("/")}
              </span>
              <span>Temporada: {data.season === "high" ? "Alta" : "Baja"}</span>
            </div>
          </header>

          <p className="mb-4 text-sm">
            {data.count} {data.count === 1 ? "artículo alcanzó" : "artículos alcanzaron"} el
            stock mínimo configurado.
          </p>

          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 pr-3">Artículo</th>
                <th className="py-2 pr-3">Categoría</th>
                <th className="py-2 pr-3 text-right">Actual</th>
                <th className="py-2 pr-3 text-right">Mínimo</th>
                <th className="py-2 text-right">Faltante</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="py-2.5 pr-3">
                    <span className="font-semibold">
                      {item.brand ? `${item.brand} · ` : ""}
                      {item.name}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">{item.category_name}</td>
                  <td className="py-2.5 pr-3 text-right">
                    {item.current_quantity} {item.unit_abbreviation}
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    {item.active_minimum} {item.unit_abbreviation}
                  </td>
                  <td className="py-2.5 text-right font-semibold">
                    {item.shortage} {item.unit_abbreviation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}

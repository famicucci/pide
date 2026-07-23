"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PackageOpen, Printer, Search, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetch("/api/stock/alerts")
      .then((response) => response.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(data?.items.map((item) => item.category_name) ?? [])].sort((a, b) =>
        a.localeCompare(b, "es")
      ),
    [data]
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return (data?.items ?? []).filter((item) => {
      const matchesCategory = category === "all" || item.category_name === category;
      const matchesSearch =
        !term ||
        `${item.brand ?? ""} ${item.name} ${item.category_name}`
          .toLocaleLowerCase("es")
          .includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [category, data, search]);

  return (
    <>
      <div className="p-4 print:hidden sm:p-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="sr-only">Alertas de stock</h1>

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
            <div className="mb-5 flex items-center justify-between gap-4 px-1">
              <div className="flex items-center gap-3">
                <TriangleAlert className="h-6 w-6 shrink-0 text-amber-700" />
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    {data.count} {data.count === 1 ? "artículo" : "artículos"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Mínimos de temporada {data.season === "high" ? "alta" : "baja"}.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.print()}
                aria-label="Imprimir reporte"
                title="Imprimir reporte"
                className="shrink-0 rounded-xl bg-white"
                disabled={filteredItems.length === 0}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar artículo, marca o categoría"
                  className="h-12 bg-white pl-9"
                />
              </div>
              <div className="mt-3 flex items-start gap-3">
                <p className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border bg-white px-2 text-sm font-bold text-foreground">
                  {filteredItems.length}
                </p>
                <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-3">
                  {["all", ...categories].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        category === value
                          ? "bg-foreground text-background"
                          : "bg-white text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {value === "all" ? "Todas" : value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">
                No hay alertas que coincidan con la búsqueda o categoría.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredItems.map((item) => (
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
            )}
          </>
        )}
        </div>
      </div>

      {data && filteredItems.length > 0 && (
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
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "artículo alcanzó" : "artículos alcanzaron"} el stock
            mínimo configurado.
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
              {filteredItems.map((item) => (
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

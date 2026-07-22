"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function datesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${start}T12:00:00Z`);
  const last = new Date(`${end}T12:00:00Z`);
  while (current <= last && dates.length < 730) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export default function StockSeasonsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [dates, setDates] = useState<string[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/stock/seasons?year=${year}`);
    if (response.ok) {
      const payload = (await response.json()) as { dates: string[] };
      setDates(payload.dates);
    }
    setLoading(false);
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const groupedDates = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const date of dates) {
      const month = date.slice(0, 7);
      const group = groups.get(month) ?? [];
      group.push(date);
      groups.set(month, group);
    }
    return [...groups.entries()];
  }, [dates]);

  async function addRange() {
    setError("");
    if (!start || !end || start > end) {
      setError("Elegí un rango de fechas válido.");
      return;
    }
    const range = datesBetween(start, end);
    if (range.length === 0 || range.length >= 730) {
      setError("El rango es demasiado amplio.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/stock/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dates: range }),
    });
    setSaving(false);
    if (!response.ok) {
      setError("No se pudo guardar el rango.");
      return;
    }
    setStart("");
    setEnd("");
    setYear(Number(range[0].slice(0, 4)));
    load();
  }

  async function removeDate(date: string) {
    await fetch("/api/stock/seasons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dates: [date] }),
    });
    setDates((current) => current.filter((value) => value !== date));
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <p className="text-sm text-muted-foreground">Calendario de mínimos</p>
          <h1 className="text-2xl font-bold">Temporadas</h1>
        </div>

        <div className="mb-6 rounded-2xl border bg-white p-5">
          <div className="mb-4 flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-6 w-6 text-primary" />
            <div>
              <h2 className="font-bold">Marcar temporada alta</h2>
              <p className="text-sm text-muted-foreground">
                Elegí un día o rango. Todas las fechas no marcadas serán temporada baja.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="space-y-1">
              <Label>Desde</Label>
              <Input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
            </label>
            <label className="space-y-1">
              <Label>Hasta</Label>
              <Input
                type="date"
                min={start}
                value={end}
                onChange={(event) => setEnd(event.target.value)}
              />
            </label>
            <Button onClick={addRange} disabled={saving}>
              {saving ? "Guardando..." : "Marcar como alta"}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Fechas de temporada alta</h2>
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="h-10 rounded-md border bg-white px-3 text-sm"
          >
            {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : groupedDates.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">
            No hay fechas de temporada alta configuradas para {year}.
          </div>
        ) : (
          <div className="space-y-4">
            {groupedDates.map(([month, monthDates]) => (
              <section key={month} className="rounded-2xl border bg-white p-4">
                <h3 className="mb-3 font-bold capitalize">
                  {new Intl.DateTimeFormat("es-AR", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(`${month}-15T12:00:00Z`))}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {monthDates.map((date) => (
                    <div
                      key={date}
                      className="flex min-h-11 items-center justify-between rounded-xl bg-muted/60 px-3"
                    >
                      <span className="text-sm font-medium capitalize">{formatDate(date)}</span>
                      <button
                        onClick={() => removeDate(date)}
                        aria-label={`Quitar ${formatDate(date)}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-white hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
